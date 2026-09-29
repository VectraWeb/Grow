from abc import ABC, abstractmethod
from apps.inventory.models import Product
from apps.integrations.models import ProductPublication


class MarketplaceProvider(ABC):
    """Interface for marketplace channel implementations."""

    channel: str

    @abstractmethod
    def publish(self, product: Product) -> dict:
        """Publish a product. Returns {'status': 'success'|'error', ...}."""

    @abstractmethod
    def update(self, publication: ProductPublication, product: Product) -> dict:
        """Update an existing publication."""

    @abstractmethod
    def delete(self, publication: ProductPublication) -> bool:
        """Remove a publication from the channel."""

    @abstractmethod
    def get_status(self, publication: ProductPublication) -> dict:
        """Fetch current status from the channel."""

    def get_or_create_draft(self, product: Product) -> ProductPublication:
        """Get existing or create draft publication for this product+channel."""
        pub, _ = ProductPublication.objects.get_or_create(
            product=product,
            channel=self.channel,
            defaults={'status': 'DRAFT'}
        )
        return pub
