import os
import sys
import django

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'grow_saas.settings')
django.setup()

from apps.inventory.models import Category

GROW_CATEGORIES = [
    ("Sustratos y Tierras", 1),
    ("Fertilizantes y Nutrientes", 2),
    ("Semillas", 3),
    ("Carpas e Indoor", 4),
    ("Iluminación LED", 5),
    ("Ventilación y Filtros", 6),
    ("Macetas y Riego", 7),
    ("Control y Medición", 8),
    ("Parafernalia y Accesorios", 9),
]

def seed_categories():
    print("--- Seeding Tierra Verde Grow categories ---")
    added = 0
    for cat_name, order in GROW_CATEGORIES:
        category, created = Category.objects.get_or_create(
            name=cat_name,
            defaults={"display_order": order}
        )
        if created:
            print(f"Created: {cat_name}")
            added += 1
        else:
            print(f"Already exists: {cat_name}")

    print(f"--- Seeding completed. Added {added} new categories. ---\n")

if __name__ == "__main__":
    seed_categories()
