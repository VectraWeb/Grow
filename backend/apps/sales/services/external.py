# Servicio de integración con pasarelas de pago externas (Stripe, MercadoPago)
# Procesa pagos y valida transacciones
import requests
from django.conf import settings
from apps.sales.models import Sale

class WhatsAppService:
    @staticmethod
    def send_message(phone_number, text):
        """ Sends a template message via WhatsApp Business Cloud API """
        url = f"https://graph.facebook.com/v17.0/{settings.WA_PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {settings.WA_TOKEN}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": phone_number,
            "type": "text",
            "text": {"body": text}
        }
        # In real life: requests.post(url, headers=headers, json=payload)
        return "Message Sent"

    @staticmethod
    def send_invoice_pdf(phone_number, invoice_url):
        """ Sends the PDF invoice link to the customer via WhatsApp """
        text = f"Hola! Aquí tienes tu factura: {invoice_url}"
        return WhatsAppService.send_message(phone_number, text)


