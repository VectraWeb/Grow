# Script para inicializar un nuevo tenant con sus tablas de bd y datos de prueba
# Realiza migraciones y crea usuarios administradores para cada cliente
import os
import django
from django.db import connection

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferre_saas.settings')
django.setup()

from apps.tenants.models import Client, Domain
from apps.users.models import User

def initialize():
    print("--- Initializing FerreSaaS ---")
    
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
    if not Client.objects.filter(schema_name='ferre1').exists():
        ferre1 = Client(
            schema_name='ferre1',
            name='Ferretería Central'
        )
        ferre1.save()
        Domain.objects.create(
            domain='ferre1.localhost',
            tenant=ferre1,
            is_primary=True
        )
        print("Done: Tenant 'ferre1' and domain 'ferre1.localhost' created.")
    
    # 3. Create Superuser in Public (for SaaS management)
    if not User.objects.filter(email='admin@ferresaas.com').exists():
        User.objects.create_superuser(
            email='admin@ferresaas.com',
            password='adminpassword',
            first_name='Admin',
            last_name='Global'
        )
        print("Done: Superuser admin@ferresaas.com created.")

if __name__ == "__main__":
    initialize()
