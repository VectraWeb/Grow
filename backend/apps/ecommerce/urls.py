# Rutas (URLs) para los endpoints del módulo de e-commerce
# Expone funcionalidad de carrito, promociones y catálogo de productos
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.ecommerce.views import BannerViewSet, PromotionViewSet, EcommerceProductViewSet, CartViewSet, ProductRatingViewSet, PublicCheckoutViewSet

router = DefaultRouter()
router.register(r'banners', BannerViewSet, basename='banner')
router.register(r'promotions', PromotionViewSet)
router.register(r'products', EcommerceProductViewSet)
router.register(r'carts', CartViewSet)
router.register(r'ratings', ProductRatingViewSet)
router.register(r'checkout', PublicCheckoutViewSet, basename='checkout')

urlpatterns = [
    path('', include(router.urls)),
]
