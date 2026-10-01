import mercadopago
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class MercadoPagoService:
    @staticmethod
    def get_token(access_token=None):
        if access_token:
            return access_token
        from apps.users.models import StoreConfig
        cfg = StoreConfig.objects.first()
        if cfg and cfg.mp_access_token:
            return cfg.mp_access_token
        return getattr(settings, 'MP_ACCESS_TOKEN', '')

    @staticmethod
    def create_preference(items, external_reference, access_token=None, base_url=None, payer_data=None, shipping_cost=0):
        """
        Creates a payment preference in Mercado Pago.
        - items: list of dicts with id, title, quantity, unit_price
        - external_reference: Sale ID
        - access_token: Store specific MP token
        - base_url: Host for backend webhooks
        - payer_data: dict with email, name, phone, address
        - shipping_cost: optional shipping fee item
        """
        token = MercadoPagoService.get_token(access_token)
        if not token:
            raise ValueError("No se encontró ningún Access Token de Mercado Pago configurado.")

        sdk = mercadopago.SDK(token)
        
        # URL del Frontend (Vercel en producción, localhost:4200 en dev)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://tierra-verde-grow.vercel.app').rstrip('/')
        if base_url and ('localhost:4200' in base_url or '127.0.0.1:4200' in base_url):
            frontend_url = "http://localhost:4200"

        urls = {
            "success": f"{frontend_url}/checkout/success",
            "failure": f"{frontend_url}/checkout/failure",
            "pending": f"{frontend_url}/checkout/pending",
        }

        # Preparar lista final de ítems
        final_items = list(items)
        if shipping_cost and float(shipping_cost) > 0:
            final_items.append({
                "id": "shipping_fee",
                "title": "Costo de Envío",
                "quantity": 1,
                "unit_price": float(shipping_cost),
                "currency_id": "ARS"
            })

        preference_data = {
            "items": final_items,
            "external_reference": str(external_reference),
            "back_urls": urls,
            "auto_return": "approved",
            "binary_mode": True,
            "statement_descriptor": "TIERRA VERDE GROW",
        }

        if payer_data and isinstance(payer_data, dict):
            payer = {}
            if payer_data.get('email'):
                payer['email'] = payer_data['email']
            if payer_data.get('name'):
                payer['name'] = payer_data['name']
            if payer_data.get('phone'):
                payer['phone'] = {'number': str(payer_data['phone'])}
            if payer_data.get('address'):
                payer['address'] = {'street_name': str(payer_data['address'])}
            if payer:
                preference_data["payer"] = payer

        # Configuración de Webhook / Notificaciones IPN
        webhook_url = getattr(settings, 'MP_WEBHOOK_URL', '')
        if not webhook_url or 'localhost' in webhook_url or '127.0.0.1' in webhook_url:
            if base_url and 'http' in base_url and not ('localhost' in base_url or '127.0.0.1' in base_url):
                webhook_url = f"{base_url.rstrip('/')}/api/integrations/mercadopago/webhook/"

        if webhook_url and not ('localhost' in webhook_url or '127.0.0.1' in webhook_url):
            preference_data["notification_url"] = webhook_url

        logger.info(f"Creando preferencia Mercado Pago para venta #{external_reference}")
        preference_response = sdk.preference().create(preference_data)

        if preference_response.get("status") in (200, 201):
            return preference_response["response"]
        else:
            err_msg = preference_response.get('response', 'Respuesta no válida de Mercado Pago')
            logger.error(f"Error al crear preferencia MP: {err_msg}")
            raise Exception(f"Error Mercado Pago API: {err_msg}")

    @staticmethod
    def get_payment_info(payment_id, access_token=None):
        """Obtiene información de un pago realizado desde la API de Mercado Pago"""
        token = MercadoPagoService.get_token(access_token)
        sdk = mercadopago.SDK(token)
        payment_info = sdk.payment().get(payment_id)
        return payment_info.get("response", {})
