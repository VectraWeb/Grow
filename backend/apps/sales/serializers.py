# Serializadores para vender, clientes, tickets y presupuestos
# Convierte nómina de SQL a JSON con información de transacciones e items vendidos
from rest_framework import serializers
from apps.sales.models import Sale, SaleItem, Customer, Ticket
from apps.inventory.models import Product, StockMovement, Kit
from apps.users.models import User

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ('id', 'name', 'email', 'cuit', 'customer_type', 'total_spent')

class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = SaleItem
        fields = ('id', 'product', 'product_name', 'quantity', 'price_at_sale', 'subtotal')

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)
    
    class Meta:
        model = Sale
        fields = '__all__'
    
    def create(self, validated_data):
        """ Create sale and update stock """
        items_data = self.context.get('items', [])
        sale = Sale.objects.create(**validated_data)
        
        for item in items_data:
            from apps.inventory.models import Product, StockMovement, Kit
            
            # Check if it's a single product or a Kit
            try:
                prod = Product.objects.get(id=item['product'])
                self._reduce_product_stock(sale, prod, item['quantity'], item['price_at_sale'])
            except Product.DoesNotExist:
                # Handle Kit
                kit = Kit.objects.get(id=item['product'])
                for kit_item in kit.kititem_set.all():
                    self._reduce_product_stock(sale, kit_item.product, kit_item.quantity * item['quantity'], 0) # Cost is internal
                
                SaleItem.objects.create(
                    sale=sale,
                    product=None, # Or link to a "Kit" field if added
                    quantity=item['quantity'],
                    price_at_sale=item['price_at_sale'],
                    subtotal=item['quantity'] * item['price_at_sale']
                )

        return sale

    def _reduce_product_stock(self, sale, product, quantity, price):
        from apps.inventory.models import StockMovement
        product.stock_current -= quantity
        product.save()
        StockMovement.objects.create(
            product=product,
            quantity=-quantity,
            type='OUT',
            note=f"Venta #{sale.id}"
        )
        if price > 0: # Only create SaleItem for the main product, not the components if it's a kit
            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                price_at_sale=price,
                subtotal=quantity * price
            )

class TicketSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    class Meta:
        model = Ticket
        fields = '__all__'
