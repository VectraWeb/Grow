import os
import sys
import django

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferre_saas.settings')
django.setup()

from django.db import connection
from apps.inventory.models import Category
from apps.tenants.models import Client

def seed_categories():
    tenants = Client.objects.exclude(schema_name='public')
    if not tenants.exists():
        print("No tenants found.")
        return

    categories = [
        "Herramientas Manuales",
        "Herramientas Eléctricas",
        "Herramientas Inalámbricas",
        "Accesorios para Herramientas",
        "Materiales de Construcción",
        "Electricidad",
        "Iluminación",
        "Plomería y Agua",
        "Gas",
        "Pintura y Cuidado de Superficies",
        "Tornillería, Clavos y Fijaciones",
        "Jardinería y Aire Libre",
        "Seguridad Industrial y Ropa de Trabajo",
        "Adhesivos, Selladores y Cintas",
        "Cerrajería y Herrajes",
        "Automotor y Lubricantes",
        "Limpieza y Mantenimiento",
        "Abrasivos",
        "Cables y Alambres",
        "Techado y Aislantes",
        "Baño y Cocina",
        "Soldadura",
        "Medición y Nivelación"
    ]

    for tenant in tenants:
        print(f"--- Seeding categories for schema '{tenant.schema_name}' ---")
        connection.set_tenant(tenant)
        added = 0
        for cat_name in categories:
            category, created = Category.objects.get_or_create(name=cat_name)
            if created:
                print(f"Created: {cat_name}")
                added += 1
            else:
                print(f"Already exists: {cat_name}")

        print(f"--- Seeding completed for {tenant.schema_name}. Added {added} new categories. ---\n")
if __name__ == "__main__":
    seed_categories()
