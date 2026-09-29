import requests
from django.conf import settings
from apps.inventory.models import Product
from apps.integrations.models import ProductPublication
from apps.integrations.services.meli import MeLiService
from apps.integrations.services.base import MarketplaceProvider
from django.utils import timezone


class MercadoLibreProvider(MarketplaceProvider):
    """MercadoLibre marketplace provider using the official API."""

    channel = 'MELI'

    def publish(self, product: Product) -> dict:
        access_token = MeLiService.get_token()
        if not access_token:
            return {'status': 'error', 'message': 'Cuenta de Mercado Libre no vinculada.'}

        if not product.meli_category_id:
            return {'status': 'error', 'message': 'El producto no tiene categoría de Mercado Libre asignada.'}

        if not product.image:
            return {'status': 'error', 'message': 'El producto debe tener una imagen para publicar.'}

        full_title = f"{product.brand} {product.name}" if product.brand and product.brand.lower() not in product.name.lower() else product.name

        image_url = product.image.url if product.image else ''
        if image_url and not image_url.startswith('http'):
            image_url = f"{settings.SITE_URL}{image_url}"

        payload = {
            "title": full_title[:60],
            "category_id": product.meli_category_id,
            "price": float(product.price_retail),
            "currency_id": "ARS",
            "available_quantity": product.stock_current,
            "buying_mode": "buy_it_now",
            "listing_type_id": product.meli_listing_type or 'gold_special',
            "condition": product.meli_condition or 'new',
            "status": "paused",
            "description": {"plain_text": product.description or "Sin descripción."},
            "pictures": [{"source": image_url}],
            "attributes": [],
            "shipping": {
                "mode": "me2",
                "local_pick_up": True,
                "free_shipping": False
            }
        }

        if product.brand:
            payload["attributes"].append({"id": "BRAND", "value_name": product.brand})
        if product.sku:
            payload["attributes"].append({"id": "MODEL", "value_name": product.sku})
        if product.barcode:
            payload["attributes"].append({"id": "GTIN", "value_name": product.barcode})

        url = f"https://api.mercadolibre.com/items?access_token={access_token}"
        resp = requests.post(url, json=payload, timeout=30)

        if resp.status_code == 201:
            data = resp.json()
            item_id = data.get('id')
            pub, _ = ProductPublication.objects.update_or_create(
                product=product,
                channel='MELI',
                defaults={
                    'channel_publication_id': item_id,
                    'publication_url': f"https://www.mercadolibre.com.ar/publicaciones/{item_id}/modificar",
                    'status': 'PUBLISHED',
                    'error_message': None,
                    'last_sync': timezone.now(),
                }
            )
            product.meli_item_id = item_id
            product.meli_sync = True
            product.save(update_fields=['meli_item_id', 'meli_sync'])
            return {'status': 'success', 'item_id': item_id, 'publication_id': pub.id}

        error_msg = resp.text
        try:
            error_msg = resp.json().get('message', resp.text)
        except Exception:
            pass

        ProductPublication.objects.update_or_create(
            product=product,
            channel='MELI',
            defaults={
                'status': 'ERROR',
                'error_message': f"HTTP {resp.status_code}: {error_msg}",
                'last_sync': timezone.now(),
            }
        )
        return {'status': 'error', 'message': error_msg}

    def update(self, publication: ProductPublication, product: Product) -> dict:
        access_token = MeLiService.get_token()
        if not access_token:
            return {'status': 'error', 'message': 'Cuenta de Mercado Libre no vinculada.'}

        item_id = publication.channel_publication_id
        if not item_id:
            return {'status': 'error', 'message': 'No hay ID de publicación para actualizar.'}

        image_url = product.image.url if product.image else ''
        if image_url and not image_url.startswith('http'):
            image_url = f"{settings.SITE_URL}{image_url}"

        payload = {
            "title": product.name[:60],
            "price": float(product.price_retail),
            "available_quantity": product.stock_current,
        }

        if product.image:
            payload["pictures"] = [{"source": image_url}]

        url = f"https://api.mercadolibre.com/items/{item_id}?access_token={access_token}"
        resp = requests.put(url, json=payload, timeout=30)

        if resp.status_code == 200:
            publication.status = 'PUBLISHED'
            publication.error_message = None
            publication.last_sync = timezone.now()
            publication.save(update_fields=['status', 'error_message', 'last_sync'])
            return {'status': 'success'}

        error_msg = resp.text
        try:
            error_msg = resp.json().get('message', resp.text)
        except Exception:
            pass

        publication.status = 'ERROR'
        publication.error_message = f"HTTP {resp.status_code}: {error_msg}"
        publication.last_sync = timezone.now()
        publication.save(update_fields=['status', 'error_message', 'last_sync'])
        return {'status': 'error', 'message': error_msg}

    def delete(self, publication: ProductPublication) -> bool:
        access_token = MeLiService.get_token()
        if not access_token:
            return False

        item_id = publication.channel_publication_id
        if not item_id:
            publication.status = 'REMOVED'
            publication.save(update_fields=['status'])
            return True

        url = f"https://api.mercadolibre.com/items/{item_id}?access_token={access_token}"
        resp = requests.delete(url, timeout=30)

        if resp.status_code in (200, 204):
            publication.status = 'REMOVED'
            publication.channel_publication_id = None
            publication.error_message = None
            publication.save(update_fields=['status', 'channel_publication_id', 'error_message'])
            return True

        publication.status = 'ERROR'
        publication.error_message = f"Error al eliminar: HTTP {resp.status_code}"
        publication.save(update_fields=['status', 'error_message'])
        return False

    def get_status(self, publication: ProductPublication) -> dict:
        access_token = MeLiService.get_token()
        if not access_token or not publication.channel_publication_id:
            return {'status': publication.status, 'channel': 'MELI'}

        url = f"https://api.mercadolibre.com/items/{publication.channel_publication_id}?access_token={access_token}"
        try:
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                ml_status = data.get('status', 'unknown')
                status_map = {'active': 'PUBLISHED', 'paused': 'PUBLISHED', 'closed': 'REMOVED'}
                publication.status = status_map.get(ml_status, 'ERROR')
                publication.last_sync = timezone.now()
                publication.save(update_fields=['status', 'last_sync'])
                return {
                    'status': publication.status,
                    'channel': 'MELI',
                    'ml_status': ml_status,
                    'title': data.get('title'),
                    'price': data.get('price'),
                    'available_quantity': data.get('available_quantity'),
                }
        except requests.RequestException:
            pass

        return {'status': publication.status, 'channel': 'MELI'}
