# Rutas (URLs) para los endpoints del módulo de e-commerce
# Expone funcionalidad de carrito, promociones y catálogo de productos
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.ecommerce.views import BannerViewSet, PromotionViewSet, EcommerceProductViewSet, CartViewSet, ProductRatingViewSet, PublicCheckoutViewSet

router = DefaultRouter()
router.register(r'banners', BannerViewSet, basename='banner')
router.register(r'promotions', PromotionViewSet, basename='promotion')
router.register(r'products', EcommerceProductViewSet, basename='ecommerce-product')  # basename requerido sin queryset estático
router.register(r'carts', CartViewSet, basename='cart')
router.register(r'ratings', ProductRatingViewSet, basename='rating')
router.register(r'checkout', PublicCheckoutViewSet, basename='checkout')


urlpatterns = [
    path('', include(router.urls)),
]
