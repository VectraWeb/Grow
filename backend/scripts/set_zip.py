import os
import sys
import django

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferre_saas.settings')
django.setup()

from apps.tenants.models import Client

def set_zip():
    clients = Client.objects.exclude(schema_name='public')
    for client in clients:
        client.store_postal_code = '6000'
        client.save()
        print(f"Updated {client.name} postal code to 6000")

if __name__ == "__main__":
    set_zip()
