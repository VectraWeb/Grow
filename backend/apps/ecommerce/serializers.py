# Serializadores para convertir modelos de e-commerce a JSON para la API REST
# Incluye banners, promociones, carritos y items del carrito
from rest_framework import serializers
from apps.ecommerce.models import Banner, Promotion, Cart, CartItem, ProductRating
from apps.inventory.serializers import ProductListSerializer

class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = '__all__'

class PromotionSerializer(serializers.ModelSerializer):
    products = ProductListSerializer(many=True, read_only=True)
    class Meta:
        model = Promotion
        fields = '__all__'

class CartItemSerializer(serializers.ModelSerializer):
    product_details = ProductListSerializer(source='product', read_only=True)
    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_details', 'quantity')

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'user', 'session_id', 'items', 'total', 'created_at')

    def get_total(self, obj):
        return sum(item.product.price_retail * item.quantity for item in obj.items.all())


class ProductRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRating
        fields = ('id', 'product', 'session_id', 'rating', 'comment', 'created_at', 'updated_at')
