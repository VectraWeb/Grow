from apps.integrations.services.meli_provider import MercadoLibreProvider
from apps.integrations.services.facebook_provider import FacebookMarketplaceProvider


PROVIDERS = {
    'MELI': MercadoLibreProvider(),
    'FACEBOOK': FacebookMarketplaceProvider(),
}


def get_provider(channel: str):
    """Return the marketplace provider for the given channel."""
    provider = PROVIDERS.get(channel)
    if not provider:
        raise ValueError(f"Canal desconocido: {channel}")
    return provider
