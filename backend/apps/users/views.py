# Vistas para autenticación de usuarios: login, registro, perfiles y gestación de roles
# Maneja creación de cuentas y actualización de información de usuario
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.users.models import User, StoreConfig
from apps.sales.models import Customer
from rest_framework import serializers
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'role', 'first_name', 'last_name', 'phone')

class RegisterCustomerSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name', 'phone')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=User.CUSTOMER,
            phone=validated_data.get('phone', '')
        )
        Customer.objects.create(user=user, name=f"{user.first_name} {user.last_name}")
        return user

class CustomerRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterCustomerSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')

        if not current_password or not new_password:
            return Response({'error': 'Ingresa tu contrasena actual y la nueva'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'La nueva contrasena debe tener al menos 6 caracteres'}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.check_password(current_password):
            return Response({'error': 'La contrasena actual es incorrecta'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save()
        return Response({'message': 'Contrasena cambiada exitosamente'})

class PasswordResetRequestView(APIView):
    """Solicitar reset de contraseña por email"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Ingresa tu correo electronico'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(email=email).first()
        if user:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            frontend_url = request.data.get('frontend_url', 'http://localhost:4200')
            reset_url = f"{frontend_url}/auth/reset-password?uid={uid}&token={token}"
            
            try:
                send_mail(
                    "Restablece tu contrasena - Tierra Verde Grow",
                    f"Hola,\n\nRecibimos una solicitud para restablecer tu contrasena.\n\nHace click en el siguiente enlace:\n{reset_url}\n\nSi no solicitaste esto, ignora este mensaje.\n\nTierra Verde Grow",
                    settings.DEFAULT_FROM_EMAIL or 'noreply@tierraverdegrow.com',
                    [email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Password reset email error: {e}")
        
        # Siempre devolver OK para no revelar si el email existe
        return Response({'message': 'Si el correo esta registrado, recibiras un enlace para restablecer tu contrasena'})

class PasswordResetConfirmView(APIView):
    """Confirmar reset de contraseña con token"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        uid = request.data.get('uid', '')
        token = request.data.get('token', '')
        new_password = request.data.get('new_password', '')

        if not all([uid, token, new_password]):
            return Response({'error': 'Faltan datos'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'La contrasena debe tener al menos 6 caracteres'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Enlace invalido'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Enlace invalido o expirado'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Contrasena restablecida exitosamente'})

class RateLimitedTokenObtainPairView(TokenObtainPairView):
    pass

class StoreSettingsView(APIView):
    def get(self, request):
        config = StoreConfig.objects.first()
        if not config:
            return Response({})
            
        mp_token = config.mp_access_token or getattr(settings, 'MP_ACCESS_TOKEN', '')
        mp_token_masked = f"{mp_token[:8]}...{mp_token[-4:]}" if len(mp_token) > 12 else (mp_token if mp_token else '')

        data = {
            'store_address': config.store_address or '',
            'bank_titular': config.bank_titular or '',
            'bank_cuit': config.bank_cuit or '',
            'bank_cvu': config.bank_cvu,
            'bank_alias': config.bank_alias,
            'whatsapp_number': config.whatsapp_number,
            'instagram_url': config.instagram_url or '',
            'facebook_url': config.facebook_url or '',
            'mp_access_token': config.mp_access_token or '',
            'mp_public_key': config.mp_public_key or getattr(settings, 'MP_PUBLIC_KEY', ''),
            'has_mp_token': bool(mp_token),
            'mp_token_masked': mp_token_masked,
        }
            
        return Response(data)

    def post(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)
        if not request.user.is_staff:
            return Response({'error': 'Sin permisos'}, status=status.HTTP_403_FORBIDDEN)
        """Handle FormData with file uploads"""
        config = StoreConfig.objects.first()
        if not config:
            config = StoreConfig.objects.create()
            
        # Handle text fields
        if 'store_address' in request.data:
            config.store_address = request.data['store_address']
        if 'bank_titular' in request.data:
            config.bank_titular = request.data['bank_titular']
        if 'bank_cuit' in request.data:
            config.bank_cuit = request.data['bank_cuit']
        if 'bank_cvu' in request.data:
            config.bank_cvu = request.data['bank_cvu']
        if 'bank_alias' in request.data:
            config.bank_alias = request.data['bank_alias']
        if 'whatsapp_number' in request.data:
            config.whatsapp_number = request.data['whatsapp_number']
        if 'instagram_url' in request.data:
            config.instagram_url = request.data['instagram_url']
        if 'facebook_url' in request.data:
            config.facebook_url = request.data['facebook_url']
        if 'mp_access_token' in request.data:
            token_val = str(request.data['mp_access_token']).strip()
            if '...' not in token_val:
                config.mp_access_token = token_val
        if 'mp_public_key' in request.data:
            config.mp_public_key = str(request.data['mp_public_key']).strip()
            
        config.save()
        return Response({'status': 'ok', 'message': 'Configuración guardada exitosamente'})

    def patch(self, request):
        """Keep backward compatibility with PATCH"""
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)
        if not request.user.is_staff:
            return Response({'error': 'Sin permisos'}, status=status.HTTP_403_FORBIDDEN)
        config = StoreConfig.objects.first()
        if not config:
            config = StoreConfig.objects.create()
            
        if 'store_address' in request.data:
            config.store_address = request.data['store_address']
        if 'bank_titular' in request.data:
            config.bank_titular = request.data['bank_titular']
        if 'bank_cuit' in request.data:
            config.bank_cuit = request.data['bank_cuit']
        if 'bank_cvu' in request.data:
            config.bank_cvu = request.data['bank_cvu']
        if 'bank_alias' in request.data:
            config.bank_alias = request.data['bank_alias']
        if 'whatsapp_number' in request.data:
            config.whatsapp_number = request.data['whatsapp_number']
        if 'instagram_url' in request.data:
            config.instagram_url = request.data['instagram_url']
        if 'facebook_url' in request.data:
            config.facebook_url = request.data['facebook_url']
        if 'mp_access_token' in request.data:
            token_val = str(request.data['mp_access_token']).strip()
            if '...' not in token_val:
                config.mp_access_token = token_val
        if 'mp_public_key' in request.data:
            config.mp_public_key = str(request.data['mp_public_key']).strip()
            
        config.save()
        return Response({'status': 'ok'})

class StoreInfoView(APIView):
    permission_classes = [] # Allow public access for checkout and home page
    
    def get(self, request):
        config = StoreConfig.objects.first()
        has_mp = False
        mp_pub_key = getattr(settings, 'MP_PUBLIC_KEY', '')
        if config:
            has_mp = bool(config.mp_access_token or getattr(settings, 'MP_ACCESS_TOKEN', ''))
            mp_pub_key = config.mp_public_key or mp_pub_key
            
        if not config:
            has_mp = bool(getattr(settings, 'MP_ACCESS_TOKEN', ''))
            return Response({'has_mp': has_mp, 'name': 'Tierra Verde Grow', 'mp_public_key': mp_pub_key})
            
        return Response({
            'name': config.name,
            'store_address': config.store_address or '',
            'bank_titular': config.bank_titular or '',
            'bank_cuit': config.bank_cuit or '',
            'bank_cvu': config.bank_cvu,
            'bank_alias': config.bank_alias,
            'whatsapp_number': config.whatsapp_number,
            'instagram_url': config.instagram_url or '',
            'facebook_url': config.facebook_url or '',
            'has_mp': has_mp,
            'mp_public_key': mp_pub_key
        })
