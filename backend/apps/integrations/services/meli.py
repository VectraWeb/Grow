# Integrador con API de MercadoLibre para sincronización de inventario y publicaciones automáticas
import requests
from django.conf import settings
from apps.inventory.models import Product
from apps.integrations.models import IntegrationConfig, ProductPublication
from django.utils import timezone
import logging
from urllib.parse import quote

logger = logging.getLogger(__name__)

class MeLiService:
    @staticmethod
    def get_config():
        return IntegrationConfig.objects.filter(integration_type='MELI', is_active=True).first()

    @staticmethod
    def get_token():
        """ Retrieves the access token, refreshing it if necessary """
        config = MeLiService.get_config()
        if not config or not config.access_token:
            return None
        
        # Comprobamos si expiró o está por expirar el token de la cuenta vinculada
        if config.token_expires_at and config.token_expires_at < timezone.now():
            c_id = config.client_id or getattr(settings, 'MELI_CLIENT_ID', '')
            c_secret = config.client_secret or getattr(settings, 'MELI_CLIENT_SECRET', '')
            
            if not config.refresh_token:
                return config.access_token

            payload = {
                'grant_type': 'refresh_token',
                'client_id': c_id,
                'client_secret': c_secret,
                'refresh_token': config.refresh_token
            }
            
            headers = {'Content-Type': 'application/x-www-form-urlencoded'}
            try:
                resp = requests.post("https://api.mercadolibre.com/oauth/token", data=payload, headers=headers, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    config.access_token = data['access_token']
                    config.refresh_token = data.get('refresh_token', config.refresh_token)
                    config.token_expires_at = timezone.now() + timezone.timedelta(seconds=data.get('expires_in', 21600))
                    config.save()
                else:
                    logger.error(f"ERROR REFRESH TOKEN MELI: {resp.status_code} - {resp.text}")
                    return None
            except Exception as e:
                logger.error(f"Excepción al refrescar token de MeLi: {e}")
                return None
        
        return config.access_token

    @staticmethod
    def get_auth_url():
        """ URL for authorizing a seller account via OAuth """
        config = MeLiService.get_config()
        if not config:
            config = IntegrationConfig.objects.filter(integration_type='MELI').first()
            
        client_id = (config.client_id if config else None) or getattr(settings, 'MELI_CLIENT_ID', '')
        redirect_uri = getattr(settings, 'MELI_REDIRECT_URI', 'https://tierraverdegrow.com.ar/admin/meli')
        
        if not client_id or not redirect_uri:
            return "#error-no-config"
            
        return f"https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}"

    @staticmethod
    def predict_and_assign_category(product):
        """ Predice automáticamente la categoría de MeLi usando Domain Discovery API de Argentina (MLA) """
        try:
            category_hint = product.category.name if product.category else ''
            query = f"{product.name} {category_hint}".strip()
            url = f"https://api.mercadolibre.com/sites/MLA/domain_discovery/search?q={quote(query)}&limit=1"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200 and resp.json():
                cat_id = resp.json()[0].get('category_id')
                if cat_id:
                    product.meli_category_id = cat_id
                    product.save(update_fields=['meli_category_id'])
                    return cat_id
        except Exception as e:
            logger.warning(f"No se pudo predecir categoría de MeLi para '{product.name}': {e}")
        return getattr(product, 'meli_category_id', None) or 'MLA388506'

    @staticmethod
    def publish_product(product_id, access_token=None):
        """ Publica un producto local directamente en Mercado Libre """
        if not access_token:
            access_token = MeLiService.get_token()
            
        if not access_token:
            logger.info("No hay token disponible para publicar en MeLi.")
            return {"status": "error", "message": "No hay cuenta de Mercado Libre vinculada"}

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return {"status": "error", "message": "Producto no encontrado"}

        # Si ya tiene publicación activa en MeLi, actualizar stock y precio en su lugar
        if product.meli_item_id and not product.meli_item_id.endswith("MOCK"):
            res = MeLiService.sync_stock_and_price(product.id, access_token)
            return {"status": "success", "item_id": product.meli_item_id, "message": res, "url": f"https://articulo.mercadolibre.com.ar/{product.meli_item_id}"}
        
        # Categoría MeLi válida
        category_id = product.meli_category_id
        if not category_id or category_id == 'MLA1234':
            category_id = MeLiService.predict_and_assign_category(product)

        # Título optimizado: Máximo 60 caracteres (límite estricto de MeLi)
        full_title = f"{product.brand} {product.name}" if product.brand and product.brand.lower() not in product.name.lower() else product.name
        title = full_title[:60].strip()

        # Imágenes: deben ser URLs públicas válidas
        pictures = []
        if product.image:
            img_url = str(product.image.url if hasattr(product.image, 'url') else product.image)
            if img_url.startswith('//'):
                img_url = f"https:{img_url}"
            elif img_url.startswith('/'):
                backend_url = getattr(settings, 'BACKEND_URL', 'https://tierra-verde-grow-api.onrender.com').rstrip('/')
                img_url = f"{backend_url}{img_url}"
            
            if img_url.startswith('http://') or img_url.startswith('https://'):
                pictures.append({"source": img_url})

        # Estado: activo si hay stock, pausado si está agotado
        initial_status = "active" if product.stock_current > 0 else "paused"

        payload = {
            "title": title,
            "category_id": category_id,
            "price": float(product.price_retail),
            "currency_id": "ARS",
            "available_quantity": max(1, int(product.stock_current)),
            "buying_mode": "buy_it_now",
            "listing_type_id": getattr(product, 'meli_listing_type', 'gold_special') or 'gold_special',
            "condition": getattr(product, 'meli_condition', 'new') or 'new',
            "status": initial_status,
            "description": {"plain_text": product.description or f"Producto original {product.name}. Calidad garantizada por Tierra Verde Grow."},
            "attributes": [
                {"id": "BRAND", "value_name": product.brand or 'Tierra Verde Grow'},
                {"id": "MODEL", "value_name": product.sku or product.name[:30]},
                {"id": "IS_FACTORY_KIT", "value_name": "No"},
            ],
            "shipping": {
                "mode": "me2",
                "local_pick_up": True,
                "free_shipping": False
            }
        }

        if pictures:
            payload["pictures"] = pictures

        if product.barcode:
            payload["attributes"].append({"id": "GTIN", "value_name": product.barcode})

        url = f"https://api.mercadolibre.com/items?access_token={access_token}"
        try:
            resp = requests.post(url, json=payload, timeout=12)
            if resp.status_code in (200, 201):
                data = resp.json()
                item_id = data.get('id')
                product.meli_item_id = item_id
                product.meli_sync = True
                product.save(update_fields=['meli_item_id', 'meli_sync'])

                pub_url = data.get('permalink') or f"https://articulo.mercadolibre.com.ar/{item_id}"
                ProductPublication.objects.update_or_create(
                    product=product,
                    channel='MELI',
                    defaults={
                        'channel_publication_id': item_id,
                        'publication_url': pub_url,
                        'status': 'PUBLISHED',
                        'last_sync': timezone.now(),
                        'error_message': None
                    }
                )
                return {"status": "success", "item_id": item_id, "url": pub_url}
            else:
                logger.error(f"Error publicando producto en MeLi ({resp.status_code}): {resp.text}")
                ProductPublication.objects.update_or_create(
                    product=product,
                    channel='MELI',
                    defaults={
                        'status': 'ERROR',
                        'error_message': resp.text[:500],
                        'last_sync': timezone.now()
                    }
                )
                # Fallback mock si está habilitado en entorno de desarrollo/test
                if getattr(settings, 'MOCK_EXTERNAL_SERVICES', False):
                    product.meli_item_id = f"MLA-{product.id}MOCK"
                    product.meli_sync = True
                    product.save(update_fields=['meli_item_id', 'meli_sync'])
                    return {"status": "success", "item_id": product.meli_item_id, "url": f"https://articulo.mercadolibre.com.ar/{product.meli_item_id}"}
                return {"status": "error", "message": f"Error MeLi: {resp.status_code}", "details": resp.text}
        except Exception as e:
            logger.error(f"Excepción de red al publicar en MeLi: {e}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def sync_stock_and_price(product_id, access_token=None):
        """ Sincroniza stock y precio minorista actual hacia Mercado Libre """
        if not access_token:
            access_token = MeLiService.get_token()
            
        if not access_token:
            return "No token available"

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return "Product not found"

        if not product.meli_item_id or product.meli_item_id.endswith("MOCK"):
            return "Item not linked"
            
        payload = {
            "available_quantity": max(0, int(product.stock_current)),
            "price": float(product.price_retail)
        }
        
        # Si se quedó sin stock, pausar la publicación; si vuelve a tener stock, reactivarla
        if product.stock_current <= 0:
            payload["status"] = "paused"
        
        url = f"https://api.mercadolibre.com/items/{product.meli_item_id}?access_token={access_token}"
        try:
            resp = requests.put(url, json=payload, timeout=10)
            if resp.status_code == 200:
                ProductPublication.objects.filter(product=product, channel='MELI').update(
                    last_sync=timezone.now(),
                    status='PUBLISHED'
                )
                return "Synced"
            else:
                logger.error(f"Error sincronizando stock/precio en MeLi: {resp.status_code} - {resp.text}")
                return f"Error: {resp.status_code}"
        except Exception as e:
            logger.error(f"Excepción al sincronizar con MeLi: {e}")
            return str(e)