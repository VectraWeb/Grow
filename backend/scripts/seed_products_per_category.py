import os
import sys
import django

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'grow_saas.settings')
django.setup()

from scripts.import_grow_catalog import import_catalog

def seed_products():
    print("--- Seeding Tierra Verde Grow products from catalog ---")
    import_catalog(clear_existing=False)
    print("--- Seeding completed successfully ---")

if __name__ == "__main__":
    seed_products()
