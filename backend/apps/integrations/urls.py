# Rutas de integraciones con plataformas externas como MercadoLibre
# Permite sincronización de catálogos y órdenes
from django.urls import path
from apps.integrations.views import (
    MeLiSyncView, MercadoPagoPreferenceView, MercadoPagoWebhookView,
    MeLiCategoryPredictorView, MeLiAuthUrlView, MeLiAuthorizeView, MeLiConfigView,
    MeLiCategorySearchView, MercadoPagoAuthUrlView, MercadoPagoAuthorizeView,
    MeLiCallbackView, MeLiDisconnectView
)
from apps.integrations.marketplace_views import (
    MarketplacePublishView, MarketplaceUpdateView, MarketplaceDeleteView,
    MarketplaceStatusView, MarketplaceFacebookPreviewView
)

urlpatterns = [
    path('meli/config/', MeLiConfigView.as_view(), name='meli_config'),
    path('meli/auth-url/', MeLiAuthUrlView.as_view(), name='meli_auth_url'),
    path('meli/authorize/', MeLiAuthorizeView.as_view(), name='meli_authorize'),
    path('meli/sync/', MeLiSyncView.as_view(), name='meli_sync_all'),
    path('meli/sync/<int:product_id>/', MeLiSyncView.as_view(), name='meli_sync_item'),
    path('meli/predict-category/', MeLiCategoryPredictorView.as_view(), name='meli_predict_category'),
    path('meli/search-category/', MeLiCategorySearchView.as_view(), name='meli_search_category'),
    path('mercadopago/auth-url/', MercadoPagoAuthUrlView.as_view(), name='mp_auth_url'),
    path('mercadopago/authorize/', MercadoPagoAuthorizeView.as_view(), name='mp_authorize'),
    path('mercadopago/preference/', MercadoPagoPreferenceView.as_view(), name='mp_preference'),
    
    # Callback público de ML (sin auth, redirige al frontend)
    path('meli/callback/', MeLiCallbackView.as_view(), name='meli_callback'),
    path('meli/disconnect/', MeLiDisconnectView.as_view(), name='meli_disconnect'),
    
    path('mercadopago/webhook/', MercadoPagoWebhookView.as_view(), name='mp_webhook'),

    # Marketplace publishing
    path('marketplace/publish/', MarketplacePublishView.as_view(), name='marketplace_publish'),
    path('marketplace/update/', MarketplaceUpdateView.as_view(), name='marketplace_update'),
    path('marketplace/delete/', MarketplaceDeleteView.as_view(), name='marketplace_delete'),
    path('marketplace/status/<int:product_id>/', MarketplaceStatusView.as_view(), name='marketplace_status'),
    path('marketplace/facebook-preview/<int:product_id>/', MarketplaceFacebookPreviewView.as_view(), name='marketplace_fb_preview'),
]
