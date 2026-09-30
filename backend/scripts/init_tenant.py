# Script para inicializar un nuevo tenant con sus tablas de bd y datos de prueba
import os
import django
from django.db import connection

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'grow_saas.settings')
django.setup()

from apps.tenants.models import Client, Domain
from apps.users.models import User

def initialize():
    print("--- Initializing Tierra Verde Grow SaaS ---")
    
    # 1. Create Public Tenant
    if not Client.objects.filter(schema_name='public').exists():
        public_tenant = Client(
            schema_name='public',
            name='SaaS Admin System'
        )
        public_tenant.save()
        Domain.objects.create(
            domain='localhost',
            tenant=public_tenant,
            is_primary=True
        )
        print("Done: Public schema and domain 'localhost' created.")
    
    # 2. Create the first Store Tenant
    if not Client.objects.filter(schema_name='grow1').exists():
        grow1 = Client(
            schema_name='grow1',
            name='Tierra Verde Grow'
        )
        grow1.save()
        Domain.objects.create(
            domain='grow1.localhost',
            tenant=grow1,
            is_primary=True
        )
        print("Done: Tenant 'grow1' and domain 'grow1.localhost' created.")
    
    # 3. Create Superuser in Public (for SaaS management)
    if not User.objects.filter(email='admin@tierraverdegrow.com').exists():
        User.objects.create_superuser(
            email='admin@tierraverdegrow.com',
            password='AdminGrow2026!',
            first_name='Admin',
            last_name='Tierra Verde'
        )
        print("Done: Superuser admin@tierraverdegrow.com created.")

if __name__ == "__main__":
    initialize()
