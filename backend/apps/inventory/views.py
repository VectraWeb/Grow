from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.inventory.models import Product, Category, Kit, StockMovement
from apps.sales.models import SaleItem, Sale
from apps.inventory.serializers import (
    ProductSerializer, ProductListSerializer, CategorySerializer,
    KitSerializer, StockMovementSerializer
)
from apps.inventory.services.intelligence import StockIntelligenceService

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """ Returns high-level stats for the dashboard cards """
        now = timezone.now()
        import datetime
        from django.utils.timezone import make_aware
        
        # Determine the boundaries of the current month
        # Replace the awareness checking to create naive boundary dates and then make them aware.
        first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        if first_day.month == 12:
            next_month = first_day.replace(year=first_day.year + 1, month=1)
        else:
            next_month = first_day.replace(month=first_day.month + 1)

        sales_month = Sale.objects.filter(
            created_at__gte=first_day, 
            created_at__lt=next_month, 
            payment_status='PAID'
        ).aggregate(total=Sum('total'))['total'] or 0
        
        orders_month = Sale.objects.filter(
            created_at__gte=first_day, 
            created_at__lt=next_month
        ).count()
        
        new_customers = Sale.objects.filter(
            created_at__gte=first_day, 
            created_at__lt=next_month
        ).values('customer').distinct().count()
        
        alerts_count = len(StockIntelligenceService.get_all_alerts())

        return Response({
            "sales_today": float(sales_month),
            "orders_today": orders_month,
            "new_customers": new_customers,
            "alerts_count": alerts_count
        })

    @action(detail=False, methods=['get'])
    def top_products(self, request):
        """ Returns top 5 selling products in the last 30 days """
        thirty_days_ago = timezone.now() - timedelta(days=30)
        top = SaleItem.objects.filter(sale__created_at__gte=thirty_days_ago, sale__payment_status='PAID') \
            .values('product__name', 'product__sku') \
            .annotate(total_sold=Sum('quantity')) \
            .order_by('-total_sold')[:5]
        return Response(top)

    @action(detail=False, methods=['get'])
    def dead_stock(self, request):
        """ Products with zero sales in the last 60 days """
        sixty_days_ago = timezone.now() - timedelta(days=60)
        sold_ids = SaleItem.objects.filter(sale__created_at__gte=sixty_days_ago).values_list('product_id', flat=True)
        dead = Product.objects.exclude(id__in=sold_ids).filter(stock_current__gt=0)[:10]
        return Response(ProductListSerializer(dead, many=True).data)

    @action(detail=False, methods=['get'])
    def sales_by_category(self, request):
        """ Returns sales volume and amount grouped by category """
        stats = Category.objects.annotate(
            total_sales=Sum('products__saleitem__subtotal', filter=F('products__saleitem__sale__payment_status') == 'PAID'),
            items_sold=Sum('products__saleitem__quantity', filter=F('products__saleitem__sale__payment_status') == 'PAID')
        ).values('name', 'total_sales', 'items_sold')
        return Response(stats)

    @action(detail=False, methods=['get'])
    def revenue_stats(self, request):
        """ Returns revenue and profit estimates for the last 7 days """
        seven_days_ago = timezone.now() - timedelta(days=7)
        daily_stats = []
        
        for i in range(8):
            date = (timezone.now() - timedelta(days=i)).date()
            day_sales = Sale.objects.filter(created_at__date=date, payment_status='PAID').aggregate(
                revenue=Sum('total'),
                # Note: Profit would require calculating SaleItem total price - cost_price
            )
            daily_stats.append({
                "date": date,
                "revenue": float(day_sales['revenue'] or 0)
            })
            
        return Response(daily_stats)

from django.db.models import Max
import re

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    @action(detail=False, methods=['get'], url_path='next-sku')
    def next_sku(self, request):
        """ Returns the next available SKU based on current records """
        # Look for the max SKU that matches our internal pattern SKU-XXXX
        last_sku = Product.objects.filter(sku__regex=r'^SKU-\d+$').aggregate(Max('sku'))['sku__max']
        
        next_num = 1
        if last_sku:
            # Extract number
            match = re.search(r'(\d+)', last_sku)
            if match:
                next_num = int(match.group(1)) + 1
        
        from rest_framework.response import Response
        return Response({
            'next_sku': f"SKU-{next_num:04d}"
        })
    
    def get_permissions(self):
        """
        Allow anyone to list/retrieve products.
        Require authentication for create/update/delete.
        """
        if self.action in ['list', 'retrieve', 'calculate_shipping']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        """Use ProductListSerializer for list, ProductSerializer for others"""
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def create(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework import status
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        response_data = serializer.data
        if hasattr(self, '_meli_url'):
            response_data['meli_url'] = self._meli_url
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        from rest_framework.response import Response
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        response_data = serializer.data
        if hasattr(self, '_meli_url'):
            response_data['meli_url'] = self._meli_url
        return Response(response_data)

    def perform_create(self, serializer):
        product = serializer.save()
        if product.meli_sync and product.meli_category_id:
            from apps.integrations.services.meli import MeLiService
            result = MeLiService.publish_product(product.id, None)
            if isinstance(result, dict) and "url" in result:
                self._meli_url = result["url"]

    def perform_update(self, serializer):
        product = serializer.save()
        if product.meli_sync:
            from apps.integrations.services.meli import MeLiService
            if product.meli_item_id:
                MeLiService.sync_stock_and_price(product.id, None)
            elif product.meli_category_id:
                result = MeLiService.publish_product(product.id, None)
                if isinstance(result, dict) and "url" in result:
                    self._meli_url = result["url"]

    def get_queryset(self):
        # Filtering logic for search
        queryset = Product.objects.all()
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        is_ecommerce = self.request.query_params.get('is_ecommerce')
        is_active = self.request.query_params.get('is_active')
        
        if category:
            queryset = queryset.filter(category__id=category)
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(sku__icontains=search)
        if is_ecommerce is not None:
            # Convert string 'true'/'false' to boolean
            is_ecommerce_bool = is_ecommerce.lower() == 'true'
            queryset = queryset.filter(is_ecommerce=is_ecommerce_bool)
        if is_active is not None:
            # Convert string 'true'/'false' to boolean
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
            
        return queryset

    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """ Returns products that need restock based on intelligence service """
        alerts = StockIntelligenceService.get_all_alerts()
        return Response(alerts)

    @action(detail=True, methods=['get'])
    def intelligence(self, request, pk=None):
        """ Returns specific intelligence analysis for one product """
        analysis = StockIntelligenceService.get_stock_analysis(pk)
        return Response(analysis)

    @action(detail=True, methods=['post'])
    def calculate_shipping(self, request, pk=None):
        product = self.get_object()
        zip_code = request.data.get('zip_code')
        if not zip_code:
            return Response({'error': 'Falta ingresar el código postal'}, status=status.HTTP_400_BAD_REQUEST)
            
        from apps.integrations.services.correo_argentino import CorreoArgentinoService
        service = CorreoArgentinoService() 
        
        # Leemos el código postal guardado en la configuración de la sucursal (tenant)
        # Si no lo cargó el admin, devolvemos un error avisándole
        from apps.users.models import StoreConfig
        config = StoreConfig.objects.first()
        origin_zip = config.store_postal_code if config else None
        
        if not origin_zip:
            return Response({'error': 'La ferretería aún no configuró su código postal origen.'}, status=status.HTTP_400_BAD_REQUEST)
        
        weight_g = 1000
        if product.weight:
            try:
                # Limpieza de string
                clean_w = ''.join([c for c in str(product.weight) if c.isdigit() or c == '.'])
                if clean_w:
                    weight_g = float(clean_w) * 1000
            except ValueError:
                pass

        import requests
        destination_name = ""
        try:
            zip_resp = requests.get(f"https://api.zippopotam.us/ar/{zip_code}", timeout=3)
            if zip_resp.status_code == 200:
                places = zip_resp.json().get("places", [])
                if places:
                    place = places[0]
                    destination_name = f"{place.get('place name', '')}, {place.get('state', '')}".title()
        except Exception:
            pass

        try:
            rates = service.get_rates(
                origin_cp=origin_zip,
                destination_cp=zip_code,
                weight_g=weight_g
            )
            if 'rates' in rates and isinstance(rates, dict):
                rates['destination_name'] = destination_name
            return Response(rates)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        """ Allow anyone to read, require auth for writes """
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

class KitViewSet(viewsets.ModelViewSet):
    queryset = Kit.objects.all()
    serializer_class = KitSerializer
    permission_classes = [permissions.IsAuthenticated]

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
