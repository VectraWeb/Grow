# Definición de rutas (URLs) principales de la API REST y panel de administración

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse, HttpResponse
from django.views.decorators.cache import cache_page, cache_control
from django.contrib.sitemaps.views import sitemap as sitemap_view

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

# Health check para warm-up (UptimeRobot, Render, etc.)
@cache_control(no_cache=True, no_store=True)
def health_check(request):
    """Endpoint de warm-up para evitar cold starts en Render Free Tier."""
    from django.db import connection
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception:
        db_ok = False
    return JsonResponse({
        "status": "ok" if db_ok else "degraded",
        "service": "tierra-verde-grow-api",
        "db": "connected" if db_ok else "error",
    }, status=200 if db_ok else 503)


# Consultar estado de tarea Celery (para polling desde el frontend)
def task_status(request, task_id):
    """Permite al frontend consultar el progreso de una tarea asíncrona."""
    try:
        from celery.result import AsyncResult
        result = AsyncResult(task_id)
        data = {
            'task_id': task_id,
            'status': result.status,   # PENDING, STARTED, SUCCESS, FAILURE
        }
        if result.successful():
            data['result'] = result.result
        elif result.failed():
            data['error'] = str(result.result)
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# Vista para la raíz del sitio
def home(request):
    return JsonResponse({
        "status": "online",
        "backend": "Tierra Verde Grow",
        "admin": "/admin-secure-grow/",
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

    # Warm-up & Health (pingear con UptimeRobot cada 5 min)
    path('health/', health_check, name='health_check'),

    # Estado de tareas asíncronas Celery
    path('api/tasks/<str:task_id>/status/', task_status, name='task_status'),

    # Panel de administración
    path('admin-secure-grow/', admin.site.urls),

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
from django.views.static import serve
from django.urls import re_path

# Sitemap.xml dinámico
from apps.ecommerce.sitemaps import SITEMAPS

# robots.txt — apunta a sitemap para mejorar crawl budget de Google
@cache_page(60 * 60 * 24)  # Cache 24hs (no cambia frecuentemente)
def robots_txt(request):
    host = request.build_absolute_uri('/').rstrip('/')
    content = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin-secure-grow/\n"
        "Disallow: /api/auth/\n"
        f"\nSitemap: {host}/sitemap.xml\n"
    )
    return HttpResponse(content, content_type='text/plain')


urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    # Sitemap dinámico — actualizado en cada deploy
    path('sitemap.xml', cache_page(60 * 60 * 6)(sitemap_view), {'sitemaps': SITEMAPS}, name='sitemap'),
    path('robots.txt', robots_txt, name='robots_txt'),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.STATIC_URL,
        document_root=settings.STATIC_ROOT
    )
