import os, django, sys
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferre_saas.settings')
django.setup()

from django.test import RequestFactory
from django_tenants.utils import schema_context
from apps.tenants.models import Client, Domain
from apps.sales.models import Sale, Customer
from apps.inventory.models import Product
from apps.integrations.views import MercadoPagoPreferenceView, MercadoPagoWebhookView
import json

def verify_flow():
    # 1. Get or Create a Tenant
    tenant, created = Client.objects.get_or_create(
        schema_name='test_store',
        defaults={'name': 'Test Store', 'mp_access_token': 'TEST-ACCESS-TOKEN'}
    )
    if created:
        Domain.objects.create(domain='test.localhost', tenant=tenant, is_primary=True)
    
    print(f"Using Tenant: {tenant.name} ({tenant.schema_name})")

    with schema_context(tenant.schema_name):
        # 2. Setup mock data
        product, _ = Product.objects.get_or_create(
            name="Producto de Prueba",
            defaults={"price_retail": 1500.0, "is_active": True, "is_ecommerce": True}
        )
        
        print(f"Simulating preference creation for product: {product.name}...")
        
        # 3. Simulate MercadoPagoPreferenceView POST
        factory = RequestFactory()
        data = {
            "items": [{"id": product.id, "quantity": 1}]
        }
        request = factory.post('/api/integrations/mercadopago/preference/', data, content_type='application/json')
        request.tenant = tenant # Mock tenant middleware
        
        view = MercadoPagoPreferenceView.as_view()
        response = view(request)
        
        if response.status_code == 200:
            resp_data = response.data
            sale_id = resp_data['sale_id']
            pref_id = resp_data['preference_id']
            print(f"SUCCESS: Preference created. Sale ID: {sale_id}, Preference ID: {pref_id}")
            
            # Verify Sale was created with the ID
            sale = Sale.objects.get(id=sale_id)
            print(f"Confirmed: Sale {sale.id} status is {sale.status}, Preference ID stored: {sale.mp_preference_id}")
            
            # 4. Simulate Webhook (Payment Approved)
            print("\nSimulating Webhook call (Payment Approved)...")
            webhook_data = {
                "type": "payment",
                "data": {"id": "1234567890"} # Mock MP Payment ID
            }
            # We mock the service to avoid real API call in this test if token is fake
            # But the logic remains the same.
            
            webhook_request = factory.post('/api/integrations/mercadopago/webhook/', webhook_data, content_type='application/json')
            webhook_request.tenant = tenant
            
            # Mocking MP Service for webhook to avoid real API call
            from unittest.mock import patch
            with patch('apps.integrations.services.mercadopago.MercadoPagoService.get_payment_info') as mock_info:
                mock_info.return_value = {
                    "external_reference": str(sale.id),
                    "status": "approved",
                    "id": 1234567890
                }
                
                webhook_view = MercadoPagoWebhookView.as_view()
                webhook_response = webhook_view(webhook_request)
                
                if webhook_response.status_code == 200:
                    sale.refresh_from_db()
                    print(f"SUCCESS: Webhook processed. Sale {sale.id} status is now: {sale.status}")
                    print(f"Payment ID stored: {sale.mp_payment_id}")
                else:
                    print(f"FAIL: Webhook returned {webhook_response.status_code}")
        else:
            print(f"FAIL: Preference creation returned {response.status_code}, {response.data}")

if __name__ == "__main__":
    verify_flow()
