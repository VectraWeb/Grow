import json
import os
import zipfile
import tempfile
from io import BytesIO
from django.conf import settings
from django.utils import timezone
from apps.inventory.models import Product
from apps.integrations.models import ProductPublication
from apps.integrations.services.base import MarketplaceProvider


class FacebookMarketplaceProvider(MarketplaceProvider):
    """Facebook Marketplace provider — prepares content for manual publication.
    
    Facebook does not offer an official API for Marketplace listings.
    This provider generates all the data needed so the user only has to
    paste it into Facebook Marketplace with minimal effort.
    """

    channel = 'FACEBOOK'

    CATEGORY_MAP = {
        'herramientas': 'Herramientas',
        'electricidad': 'Electricidad',
        'plomeria': 'Plomería',
        'pintureria': 'Pinturería',
        'ferreteria': 'Ferretería',
        'construccion': 'Construcción',
        'jardin': 'Jardín',
        'seguridad': 'Seguridad',
    }

    def _build_title(self, product: Product) -> str:
        parts = []
        if product.brand:
            parts.append(product.brand)
        parts.append(product.name)
        if product.sku:
            parts.append(f"[{product.sku}]")
        title = ' '.join(parts)
        return title[:100]

    def _build_description(self, product: Product) -> str:
        lines = [product.name, '']
        if product.description:
            lines.append(product.description)
            lines.append('')
        if product.brand:
            lines.append(f"Marca: {product.brand}")
        if product.material:
            lines.append(f"Material: {product.material}")
        if product.dimensions:
            lines.append(f"Dimensiones: {product.dimensions}")
        if product.weight:
            lines.append(f"Peso: {product.weight}")
        if product.warranty:
            lines.append(f"Garantía: {product.warranty}")
        if product.sku:
            lines.append(f"SKU: {product.sku}")
        lines.append('')
        lines.append('Consultas por mensaje.')
        return '\n'.join(lines)

    def _build_category(self, product: Product) -> str:
        cat_name = product.category.name.lower() if product.category else ''
        for key, fb_cat in self.CATEGORY_MAP.items():
            if key in cat_name:
                return fb_cat
        return 'Ferretería'

    def _get_image_urls(self, product: Product) -> list:
        urls = []
        if product.image:
            img_url = product.image.url
            if not img_url.startswith('http'):
                img_url = f"{settings.SITE_URL}{img_url}"
            urls.append(img_url)
        return urls

    def _prepare_content(self, product: Product) -> dict:
        return {
            'title': self._build_title(product),
            'description': self._build_description(product),
            'price': float(product.price_retail),
            'category': self._build_category(product),
            'condition': 'Nuevo' if product.meli_condition == 'new' else 'Usado',
            'image_urls': self._get_image_urls(product),
            'sku': product.sku or '',
            'brand': product.brand or '',
            'marketplace_url': 'https://www.facebook.com/marketplace/create/item',
        }

    def publish(self, product: Product) -> dict:
        content = self._prepare_content(product)

        pub, _ = ProductPublication.objects.update_or_create(
            product=product,
            channel='FACEBOOK',
            defaults={
                'status': 'DRAFT',
                'error_message': None,
                'last_sync': timezone.now(),
            }
        )

        return {
            'status': 'success',
            'publication_id': pub.id,
            'content': content,
            'message': (
                'Contenido preparado. Copiá el texto, descargá las imágenes '
                'y abrí Facebook Marketplace para completar la publicación.'
            ),
        }

    def update(self, publication: ProductPublication, product: Product) -> dict:
        content = self._prepare_content(product)
        publication.last_sync = timezone.now()
        publication.save(update_fields=['last_sync'])
        return {
            'status': 'success',
            'content': content,
            'message': 'Contenido actualizado.',
        }

    def delete(self, publication: ProductPublication) -> bool:
        publication.status = 'REMOVED'
        publication.channel_publication_id = None
        publication.error_message = None
        publication.save(update_fields=['status', 'channel_publication_id', 'error_message'])
        return True

    def get_status(self, publication: ProductPublication) -> dict:
        return {
            'status': publication.status,
            'channel': 'FACEBOOK',
        }
