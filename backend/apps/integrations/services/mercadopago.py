import mercadopago
from django.conf import settings

class MercadoPagoService:
    @staticmethod
    def create_preference(items, external_reference, access_token=None, base_url=None):
        """
        Creates a preference in Mercado Pago.
        Items should be a list of dictionaries with:
        id, title, quantity, unit_price
        external_reference: The ID of the Sale in our database
        access_token: The tenant-specific access token
        base_url: The current domain for back_urls and notification_url
        """
        token = access_token or settings.MP_ACCESS_TOKEN
        sdk = mercadopago.SDK(token)
        
        # Use dynamic base_url or fallback to setting
        if not base_url or 'localhost' in base_url or '127.0.0.1' in base_url:
            # For local testing, sometimes MP prefers the full IP or specific host
            # but if it was passed from request.get_host(), it should be fine.
            if not base_url:
                base_url = "http://localhost:8000"
            
        # Ensure base_url doesn't have trailing slash for consistency
        base_url = base_url.rstrip('/')
        
        urls = {
            "success": f"{base_url}/ecommerce/checkout/success",
            "failure": f"{base_url}/ecommerce/checkout/failure",
            "pending": f"{base_url}/ecommerce/checkout/pending",
        }

        preference_data = {
            "items": items,
            "external_reference": str(external_reference),
            "back_urls": urls,
            "binary_mode": True,
        }
        
        # notification_url MUST be a public HTTPS URL. 
        # We disable it for local testing to avoid validation errors.
        if not ('localhost' in base_url or '127.0.0.1' in base_url):
            preference_data["notification_url"] = f"{base_url}/api/integrations/mercadopago/webhook/"
        
        preference_response = sdk.preference().create(preference_data)
        if preference_response["status"] == 201:
            return preference_response["response"]
        else:
            raise Exception(f"Error creating MP preference: {preference_response['response']}")

    @staticmethod
    def get_payment_info(payment_id, access_token=None):
        """Fetches payment details from MP API"""
        token = access_token or settings.MP_ACCESS_TOKEN
        sdk = mercadopago.SDK(token)
        payment_info = sdk.payment().get(payment_id)
        return payment_info.get("response")
