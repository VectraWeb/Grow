# Definición de rutas (URLs) principales de la API REST y panel de administración

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.inventory.views import (
    ProductViewSet,
    CategoryViewSet,
    KitViewSet,
    StockMovementViewSet,
    DashboardViewSet
)

from apps.sales.views import (
    SaleViewSet,
    CustomerViewSet,
    TicketViewSet,
    BudgetViewSet
)

from apps.users.views import (
    CustomerRegisterView,
    UserProfileView,
    RateLimitedTokenObtainPairView,
    StoreSettingsView,
    StoreInfoView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    ChangePasswordView,
)

# Vista para la raíz del sitio
def home(request):
    return JsonResponse({
        "status": "online",
        "backend": "Ferreteria",
        "admin": "/admin-secure-ferre/",
        "api": "/api/"
    })

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'kits', KitViewSet, basename='kit')
router.register(r'stock-movements', StockMovementViewSet, basename='stock-movement')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    # Página principal
    path('', home),

    # Panel de administración
    path('admin-secure-ferre/', admin.site.urls),

    # API Router
    path('api/', include(router.urls)),

    # Auth
    path('api/auth/login/', RateLimitedTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/profile/', UserProfileView.as_view(), name='user_profile'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('api/auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('api/auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # Configuración de tienda
    path('api/tenant/settings/', StoreSettingsView.as_view(), name='store_settings'),
    path('api/tenant/info/', StoreInfoView.as_view(), name='store_info'),

    # Ecommerce
    path('api/ecommerce/', include('apps.ecommerce.urls')),

    # Integraciones
    path('api/integrations/', include('apps.integrations.urls')),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )

    urlpatterns += static(
        settings.STATIC_URL,
        document_root=settings.STATIC_ROOT
    )
