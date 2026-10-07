from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from django.db.models import Avg, Count
from apps.ecommerce.models import Banner, Promotion, Cart, CartItem, ProductRating
from apps.ecommerce.serializers import BannerSerializer, PromotionSerializer, CartSerializer, CartItemSerializer, ProductRatingSerializer
from apps.inventory.models import Product
from apps.inventory.serializers import ProductListSerializer
from apps.inventory.catalog_cache import get_cached_public_list, set_cached_public_list
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

    def list(self, request, *args, **kwargs):
        # Banners del home: mismo criterio que productos (staff ve todos,
        # público solo activos -> prefijo distinto). Cacheado y versionado:
        # cualquier escritura de banner invalida la clave al instante.
        prefix = "banners:staff" if request.user.is_authenticated else "banners"
        key, cached = get_cached_public_list(request, prefix)
        if cached is not None:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        if response.status_code == 200:
            set_cached_public_list(key, response.data)
        return response

class PromotionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Promotion.objects.filter(is_active=True)
    serializer_class = PromotionSerializer
    permission_classes = [permissions.AllowAny]

class EcommerceProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Publicly accessible product list for ecommerce (only in-stock active items)"""
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = (
            Product.objects
            .filter(is_active=True, is_ecommerce=True, stock_current__gt=0)
            .select_related('category')   # OPTIMIZACIÓN: evita N+1 al serializar category_name
            .only(                        # Solo los campos que usa ProductListSerializer
                'id', 'name', 'sku', 'price_retail', 'stock_current',
                'image', 'discount_percentage', 'meli_item_id',
                'meli_category_id', 'category_id', 'category__name',
                'featured',
            )
        )
        # Filtro por slug de categoría (ej: ?category=fertilizantes)
        category_slug = self.request.query_params.get('category')
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        # Búsqueda simple por nombre
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    @method_decorator(cache_page(60 * 5))           # Caché 5 minutos
    @method_decorator(vary_on_headers("Accept"))    # Correcto para DRF (JSON vs HTML)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @method_decorator(cache_page(60 * 10))          # Destacados cambian menos
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_products = self.get_queryset().filter(featured=True)[:8]
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
        """Obtener calificaciones y estadísticas de un producto"""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ratings = self.queryset.filter(product_id=product_id)
        serializer = self.get_serializer(ratings, many=True)

        # OPTIMIZACIÓN: Aggregate SQL en vez de calcular en Python
        # ANTES: sum(r.rating for r in ratings) / count  ← cargaba todo en memoria
        stats = ratings.aggregate(
            average_rating=Avg('rating'),
            total_reviews=Count('id')
        )

        return Response({
            'product_id': product_id,
            'ratings': serializer.data,
            'average_rating': round(stats['average_rating'] or 0, 1),
            'total_reviews': stats['total_reviews']
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
            
        # OPTIMIZACIÓN: Una sola query para todos los productos del carrito.
        # ANTES: Product.objects.get() dentro del loop → 1 query por ítem.
        product_ids = [item.get('product_id') for item in cart_items if item.get('product_id')]
        products_map = {
            str(p.id): p
            for p in Product.objects.filter(
                id__in=product_ids,
                is_active=True,
                is_ecommerce=True,
            ).only('id', 'name', 'price_retail', 'stock_current')
        }

        # Calculate totals securely from DB (never trust client prices)
        total_items = 0
        validated_items = []
        for item in cart_items:
            product = products_map.get(str(item.get('product_id')))
            if not product:
                continue
            qty = int(item.get('quantity', 1))
            price = float(product.price_retail)
            total_items += price * qty
            validated_items.append({
                'product': product,
                'quantity': qty,
                'price_at_sale': price
            })

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
                    f"Pedido #{sale.id} recibido - Tierra Verde Grow",
                    f"Hola {name},\n\nRecibimos tu pedido #{sale.id}.\n\nDetalle:\n{items_list}\n\nTotal: ${final_total}\n\nTe notificaremos cuando sea procesado.\n\nTierra Verde Grow",
                    settings.DEFAULT_FROM_EMAIL or 'noreply@tierraverdegrow.com',
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
