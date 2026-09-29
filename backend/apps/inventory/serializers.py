# Serializadores para productos, categorías, kits y movimientos de inventario
# Convierte modelos de inventario a JSON para endpoints REST
from rest_framework import serializers
from apps.inventory.models import Product, Category, Kit, KitItem, StockMovement, ProductImage

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'display_order', 'meli_category_id', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'name', 'sku', 'description',
            'price_retail', 'price_wholesale', 'cost_price', 'stock_current',
            'stock_min', 'is_active', 'is_ecommerce', 'featured', 'image',
            'barcode', 'discount_percentage', 'updated_at', 'created_at',
            'meli_item_id', 'meli_sync', 'meli_category_id', 'meli_condition',
            'meli_listing_type', 'brand', 'material', 'weight', 'dimensions',
            'warranty', 'specifications'
        ]

    def create(self, validated_data):
        images_data = self.context['request'].FILES.getlist('images')
        if 'image' in validated_data and not validated_data['image']:
            del validated_data['image']
        product = Product.objects.create(**validated_data)
        for i, image in enumerate(images_data):
            ProductImage.objects.create(product=product, image=image, display_order=i)
        return product

    def update(self, instance, validated_data):
        images_data = self.context['request'].FILES.getlist('images')
        if 'image' in validated_data and not validated_data['image']:
            del validated_data['image']
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if images_data:
            for i, image in enumerate(images_data):
                ProductImage.objects.create(product=instance, image=image, display_order=i)
        return instance

class ProductListSerializer(serializers.ModelSerializer):
    """ Slim version for lists with category """
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = ('id', 'name', 'sku', 'price_retail', 'stock_current', 'image', 'category_name', 'discount_percentage', 'meli_item_id', 'meli_category_id')

class KitItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = KitItem
        fields = ('product', 'product_name', 'quantity')

class KitSerializer(serializers.ModelSerializer):
    items = KitItemSerializer(source='kititem_set', many=True, read_only=True)
    class Meta:
        model = Kit
        fields = '__all__'

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = StockMovement
        fields = '__all__'
