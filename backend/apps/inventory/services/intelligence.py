# Servicio de inteligencia de inventario: predicción de demanda y alertas de stock
# Analiza trends de venta y sugiere reordenamientos
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum
from apps.inventory.models import Product
from apps.sales.models import SaleItem

class StockIntelligenceService:
    @staticmethod
    def get_stock_analysis(product_id):
        """
        Analyzes sales for a single product and returns:
        - daily_avg_sales: Average quantity sold per day (last 30 days)
        - est_days_remaining: Days until stock = 0
        - should_buy: Boolean alert
        - buy_quantity: Recommended buy amount (e.g. to cover 60 days)
        """
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        product = Product.objects.get(id=product_id)
        
        # Total sold in last 30 days
        total_sold = SaleItem.objects.filter(
            product=product,
            sale__created_at__gte=thirty_days_ago,
            sale__payment_status='PAID'
        ).aggregate(total=Sum('quantity'))['total'] or 0
        
        daily_avg = total_sold / 30.0
        
        if daily_avg == 0:
            est_days = 999.0 # No sales
            should_buy = product.stock_current < product.stock_min
            buy_qty = product.stock_min if should_buy else 0
        else:
            est_days = float(product.stock_current) / daily_avg
            # We want to have enough stock for at least 15 days, or if we go below stock_min
            should_buy = est_days < 15 or product.stock_current < product.stock_min
            buy_qty = (daily_avg * 60) - product.stock_current # Buy enough for 60 days
            
        return {
            'product_name': product.name,
            'current_stock': product.stock_current,
            'daily_avg_sales': float(round(daily_avg, 2)),
            'est_days_remaining': float(round(est_days, 1)),
            'should_buy': should_buy,
            'recommended_buy_qty': max(0, int(buy_qty))
        }

    @staticmethod
    def get_all_alerts():
        """ Returns all products that need a purchase restock """
        all_products = Product.objects.filter(is_active=True)
        alerts = []
        for p in all_products:
            analysis = StockIntelligenceService.get_stock_analysis(p.id)
            if analysis['should_buy']:
                alerts.append(analysis)
        return alerts
