from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.ecommerce.models import Banner, Promotion, Cart, CartItem, ProductRating
from apps.ecommerce.serializers import BannerSerializer, PromotionSerializer, CartSerializer, CartItemSerializer, ProductRatingSerializer
from apps.inventory.models import Product
from apps.inventory.serializers import ProductListSerializer
from apps.sales.models import Sale, SaleItem, Customer

class BannerViewSet(viewsets.ModelViewSet):
    serializer_class = BannerSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return Banner.objects.all().order_by('position')
        return Banner.objects.filter(is_active=True).order_by('position')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

class PromotionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Promotion.objects.filter(is_active=True)
    serializer_class = PromotionSerializer
    permission_classes = [permissions.AllowAny]

class EcommerceProductViewSet(viewsets.ReadOnlyModelViewSet):
    """ Publicly accessible product list for ecommerce """
    queryset = Product.objects.filter(is_active=True, is_ecommerce=True)
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_products = self.queryset.filter(featured=True)[:8]
        serializer = self.get_serializer(featured_products, many=True)
        return Response(serializer.data)

class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.all()
    serializer_class = CartSerializer
    permission_classes = [permissions.AllowAny] # Can be anonymous with session_id

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return self.queryset.filter(user=self.request.user)
        session_id = self.request.query_params.get('session_id')
        if session_id:
            return self.queryset.filter(session_id=session_id)
        return self.queryset.none()

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        session_id = request.data.get('session_id')
        
        cart, created = Cart.objects.get_or_create(
            user=request.user if request.user.is_authenticated else None,
            session_id=session_id if not request.user.is_authenticated else None
        )
        
        product = Product.objects.get(id=product_id)
        cart_item, item_created = CartItem.objects.get_or_create(cart=cart, product=product)
        
        if not item_created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity
        cart_item.save()
        
        return Response(CartSerializer(cart).data)


class ProductRatingViewSet(viewsets.ModelViewSet):
    """Calificaciones de productos"""
    queryset = ProductRating.objects.all()
    serializer_class = ProductRatingSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def rate_product(self, request):
        """Agregar o actualizar calificación de un producto"""
        product_id = request.data.get('product_id')
        session_id = request.data.get('session_id')
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        try:
            product = Product.objects.get(id=product_id)
            rating_obj, created = ProductRating.objects.update_or_create(
                product=product,
                session_id=session_id,
                defaults={'rating': rating, 'comment': comment}
            )
            return Response(
                ProductRatingSerializer(rating_obj).data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        except Product.DoesNotExist:
            return Response(
                {'error': 'Producto no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def by_product(self, request):
        """Obtener calificaciones de un producto"""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ratings = self.queryset.filter(product_id=product_id)
        serializer = self.get_serializer(ratings, many=True)
        
        # Calcular promedio de calificaciones
        avg_rating = 0
        count = ratings.count()
        if count > 0:
            avg_rating = sum(r.rating for r in ratings) / count
        
        return Response({
            'product_id': product_id,
            'ratings': serializer.data,
            'average_rating': round(avg_rating, 1),
            'total_reviews': count
        })

    @action(detail=False, methods=['get'])
    def user_rating(self, request):
        """Obtener calificación del usuario actual para un producto"""
        product_id = request.query_params.get('product_id')
        session_id = request.query_params.get('session_id')
        
        if not product_id:
            return Response(
                {'error': 'product_id requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            rating = ProductRating.objects.get(
                product_id=product_id,
                session_id=session_id
            )
            return Response(ProductRatingSerializer(rating).data)
        except ProductRating.DoesNotExist:
            return Response({'rating': 0}, status=status.HTTP_200_OK)

class PublicCheckoutViewSet(viewsets.ViewSet):
    """Manejo de Checkout público para registrar ventas offline (Transferencia)"""
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        data = request.data
        cart_items = data.get('items', [])
        form_data = data.get('formData', {})
        shipping_cost = float(data.get('shippingCost', 0))
        
        email = form_data.get('email', '')
        name = form_data.get('name', 'Consumidor Final')
        cuit = form_data.get('cuit', '')
        phone = form_data.get('phone', '')
        address = form_data.get('address', '')
        city = form_data.get('city', '')
        notes = form_data.get('notes', '')
        
        if not cart_items:
            return Response({"error": "El carrito está vacío"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Register or get customer
        # We try to find by Email first (most reliable for guests), then CUIT, then Name
        if email:
            customer, _ = Customer.objects.update_or_create(
                email=email, 
                defaults={'name': name, 'cuit': cuit, 'customer_type': 'RETAIL'}
            )
        elif cuit:
            customer, _ = Customer.objects.update_or_create(
                cuit=cuit, 
                defaults={'name': name, 'customer_type': 'RETAIL'}
            )
        else:
            customer, _ = Customer.objects.get_or_create(
                name=name, 
                defaults={'customer_type': 'RETAIL'}
            )
            
        # Calculate totals securely from DB (never trust client prices)
        total_items = 0
        validated_items = []
        for item in cart_items:
            try:
                product = Product.objects.get(id=item.get('product_id'))
                qty = int(item.get('quantity', 1))
                price = float(product.price_retail)
                total_items += price * qty
                validated_items.append({
                    'product': product,
                    'quantity': qty,
                    'price_at_sale': price
                })
            except Product.DoesNotExist:
                continue

        if not validated_items:
            return Response({"error": "No se encontraron productos validos"}, status=status.HTTP_400_BAD_REQUEST)

        final_total = total_items + shipping_cost
        
        # Apply 5% discount if transfer
        payment_method = data.get('paymentMethod', 'TRANSFERENCIA')
        if payment_method.lower() == 'transferencia':
            final_total = final_total * 0.95
            
        full_address = f"{address}, {city}. Notas: {notes} | Tel: {phone} | Email: {email}"
        
        # Create Sale
        sale = Sale.objects.create(
            customer=customer,
            total=final_total,
            payment_method='TRANSFERENCIA' if payment_method.lower() == 'transferencia' else 'MERCADO_PAGO',
            payment_status='PENDING',
            shipping_status='PENDING',
            shipping_address=full_address,
        )
        
        # Create Items from validated data (with DB prices)
        for item_data in validated_items:
            SaleItem.objects.create(
                sale=sale,
                product=item_data['product'],
                quantity=item_data['quantity'],
                price_at_sale=item_data['price_at_sale'],
            )

        # Send order confirmation email
        if email:
            from django.core.mail import send_mail
            from django.conf import settings
            items_list = "\n".join([f"- {i['product'].name} (x{i['quantity']}) - ${i['price_at_sale'] * i['quantity']}" for i in validated_items])
            try:
                send_mail(
                    f"Pedido #{sale.id} recibido - FerreNexo",
                    f"Hola {name},\n\nRecibimos tu pedido #{sale.id}.\n\nDetalle:\n{items_list}\n\nTotal: ${final_total}\n\nTe notificaremos cuando sea procesado.\n\nFerreNexo",
                    settings.DEFAULT_FROM_EMAIL or 'noreply@ferrenexo.com',
                    [email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Order confirmation email error: {e}")
                
        return Response({
            "status": "success", 
            "sale_id": sale.id, 
            "message": "Pedido registrado correctamente"
        }, status=status.HTTP_201_CREATED)
