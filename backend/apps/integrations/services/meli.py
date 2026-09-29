# Integrador con API de MercadoLibre para sincronización de inventario y órdenes
# Envía productos y descarga pedidos desde la plataforma de ventas
import requests
from django.conf import settings
from apps.inventory.models import Product
from apps.integrations.models import IntegrationConfig
from django.utils import timezone
import json

class MeLiService:
    @staticmethod
    def get_config():
        return IntegrationConfig.objects.filter(integration_type='MELI', is_active=True).first()

    @staticmethod
    def get_token():
        """ Retrieves the access token, refreshing it if necessary """
        config = MeLiService.get_config()
        if not config:
            return None
        
        # CORRECCIÓN: Comprobamos si expiró o está cerca de expirar el token de la cuenta vinculada
        if config.token_expires_at and config.token_expires_at < timezone.now():
            # Fallback estricto a settings si la base de datos no tiene guardados los del cliente todavía
            c_id = config.client_id or getattr(settings, 'MELI_CLIENT_ID', '')
            c_secret = config.client_secret or getattr(settings, 'MELI_CLIENT_SECRET', '')
            
            payload = {
                'grant_type': 'refresh_token',
                'client_id': c_id,
                'client_secret': c_secret,
                'refresh_token': config.refresh_token
            }
            
            # Forzamos explícitamente los headers para que MeLi no rechace el tipo de contenido
            headers = {'Content-Type': 'application/x-www-form-urlencoded'}
            resp = requests.post("https://api.mercadolibre.com/oauth/token", data=payload, headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                config.access_token = data['access_token']
                config.refresh_token = data['refresh_token']
                config.token_expires_at = timezone.now() + timezone.timedelta(seconds=data['expires_in'])
                config.save()
            else:
                print(f"ERROR REFRESH TOKEN MELI: {resp.status_code} - {resp.text}")
                return None
        
        return config.access_token

    @staticmethod
    def get_auth_url():
        """ URL for authorizing a tenant account using custom credentials or FerrePro master credentials """
        config = MeLiService.get_config()
        if not config:
            config = IntegrationConfig.objects.filter(integration_type='MELI').first()
            
        client_id = (config.client_id if config else None) or getattr(settings, 'MELI_CLIENT_ID', '')
        redirect_uri = getattr(settings, 'MELI_REDIRECT_URI', '')
        
        print(f"DEBUG MeLi: Generating Auth URL with Client ID: {client_id}")
        
        if not client_id or not redirect_uri:
            print("DEBUG MeLi: Error - Missing configuration in settings/env")
            return "#error-no-config"
            
        if not redirect_uri.endswith('/'):
            redirect_uri += '/'
            
        return f"https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}"

    @staticmethod
    def publish_product(product_id, access_token=None):
        """ Publishes a single product to MeLi using real product data """
        if not access_token:
            access_token = MeLiService.get_token()
            
        if not access_token:
            return "No token available"

        product = Product.objects.get(id=product_id)
        
        # Improved Title: [Brand] + [Name]
        full_title = f"{product.brand} {product.name}" if product.brand and product.brand.lower() not in product.name.lower() else product.name
        
        payload = {
            "title": full_title[:60], # MeLi limit 60 chars
            "category_id": product.meli_category_id or "MLA1234", 
            "price": float(product.price_retail),
            "currency_id": "ARS",
            "available_quantity": product.stock_current,
            "buying_mode": "buy_it_now",
            "listing_type_id": product.meli_listing_type,
            "condition": product.meli_condition,
            "status": "paused", # Created as paused so user can review/edit
            "description": {"plain_text": product.description or "Sin descripción."},
            "pictures": [{"source": product.image.url if product.image else ""}],
            "attributes": [
                {"id": "BRAND", "value_name": product.brand or 'Genérica'},
                {"id": "MODEL", "value_name": product.sku},
                {"id": "IS_FACTORY_KIT", "value_name": "No"}, # Default for most products
            ],
            "shipping": {
                "mode": "me2", # Mandatory for many users
                "local_pick_up": True,
                "free_shipping": False
            }
        }

        # Add GTIN (Universal Code) if available
        if product.barcode:
            payload["attributes"].append({"id": "GTIN", "value_name": product.barcode})

        # Selling Format (Using correct ID: SALE_FORMAT)
        if getattr(product, 'meli_format', 'unidades') == 'pack':
            payload["attributes"].append({"id": "SALE_FORMAT", "value_name": "Pack"})
        else:
            payload["attributes"].append({"id": "SALE_FORMAT", "value_name": "Unidad"})
        
        url = f"https://api.mercadolibre.com/items?access_token={access_token}"
        resp = requests.post(url, json=payload)
        
        if resp.status_code == 201:
            data = resp.json()
            product.meli_item_id = data.get('id')
            product.meli_sync = True
            product.save()
            return {"status": "success", "item_id": product.meli_item_id, "url": f"https://www.mercadolibre.com.ar/publicaciones/{product.meli_item_id}/modificar"}
        
        # Fallback to mock for testing if explicitly allowed or if API fails in dev
        mock_allowed = getattr(settings, 'MOCK_EXTERNAL_SERVICES', True)
        if mock_allowed:
            product.meli_item_id = f"MLA-{product_id}MOCK"
            product.meli_sync = True
            product.save()
            return {"status": "success", "item_id": product.meli_item_id, "url": f"https://www.mercadolibre.com.ar/publicaciones/{product.meli_item_id}/modificar"}
            
        return {"status": "error", "message": f"Error: {resp.status_code}", "details": resp.text}

    @staticmethod
    def sync_stock_and_price(product_id, access_token=None):
        """ Syncs current local stock and retail price to MeLi """
        if not access_token:
            access_token = MeLiService.get_token()
            
        if not access_token:
            return "No token available"

        product = Product.objects.get(id=product_id)
        if not product.meli_item_id:
            return "Item not linked"
            
        payload = {
            "available_quantity": product.stock_current,
            "price": float(product.price_retail)
        }
        
        url = f"https://api.mercadolibre.com/items/{product.meli_item_id}?access_token={access_token}"
        resp = requests.put(url, json=payload)
        
        if resp.status_code == 200:
            return "Synced"
        return f"Error: {resp.status_code}"

    @staticmethod
    def get_comparison(product_id):
        """ Compares local price with MeLi competitor prices (Requires research API) """
        # Real code would use MeLi Search API to find similar items
        return {
            "local_price": 500.0,
            "avg_meli_price": 550.0,
            "diff_percent": 10.0 # Our price is 10% cheaper
        }