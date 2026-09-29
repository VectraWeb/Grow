import os
import sys
import django
import uuid
import random

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferre_saas.settings')
django.setup()

from django.db import connection
from apps.inventory.models import Category, Product
from apps.tenants.models import Client

def generate_sku(prefix):
    return f"{prefix}-{str(uuid.uuid4())[:8].upper()}"

def seed_products():
    tenants = Client.objects.exclude(schema_name='public')
    if not tenants.exists():
        print("No tenants found.")
        return

    # Mapeo de categoría a productos a crear
    products_data = {
        "Herramientas Manuales": [
            ("Martillo de Galponero 27mm", "Martillo con mango de madera de excelente calidad y resistente.", 15000, 12000, 8000),
            ("Destornillador Phillips 6x150", "Destornillador punta imantada, cromo vanadio.", 4500, 3800, 2500)
        ],
        "Herramientas Eléctricas": [
            ("Taladro Percutor 710W", "Taladro percutor velocidad variable y reversible.", 120000, 95000, 75000),
            ("Amoladora Angular 115mm 820W", "Amoladora angular profesional con disco de corte.", 145000, 115000, 90000)
        ],
        "Herramientas Inalámbricas": [
            ("Taladro Atornillador 18V", "Taladro atornillador inalámbrico con batería de litio.", 180000, 150000, 120000),
            ("Llave de Impacto Inalámbrica 20V", "Llave de impacto 20V brushless para uso pesado.", 350000, 310000, 240000)
        ],
        "Accesorios para Herramientas": [
            ("Juego de Mechas Acero Rápido x13", "Set de mechas de alta velocidad (HSS) tipo helicoidal.", 12000, 9500, 6000),
            ("Disco de Corte para Metal 115mm", "Disco de corte fino 115x1.0mm.", 2500, 1900, 1200)
        ],
        "Materiales de Construcción": [
            ("Cemento Portland Bolsa x 50kg", "Cemento de uso general para la construcción.", 11000, 9800, 7500),
            ("Arena Fina a Granel (Metro Cúbico)", "Arena fina pura especial para revoque.", 25000, 21000, 15000)
        ],
        "Electricidad": [
            ("Tomacorriente Doble Blanco", "Módulo tomacorriente doble completo armado.", 5400, 4300, 3000),
            ("Cinta Aisladora Pvc 19mmx20m Negra", "Cinta aisladora resistente a la temperatura, primera calidad.", 1500, 1100, 750)
        ],
        "Iluminación": [
            ("Lámpara LED Bulbo 9W E27 Fria", "Lámpara led bajo consumo equivalente a 60w.", 2500, 1900, 1200),
            ("Proyector Reflector LED 50W Exterior", "Proyector led apto intemperie IP65.", 15800, 12500, 8500)
        ],
        "Plomería y Agua": [
            ("Caño Termofusión 20mm x 4m", "Caño tricapa para termofusión sistema agua fría/caliente.", 4500, 3600, 2500),
            ("Llave de Paso Esférica 1/2 fusion", "Llave de paso esférica con uniones termofusionables.", 4200, 3500, 2400)
        ],
        "Gas": [
            ("Caño Epoxi 1/2 x 6.40 Mts", "Tubo epoxi aprobado para instalaciones de gas.", 22000, 18500, 14000),
            ("Regulador de Gas Envasado", "Regulador de gas con manguera de 1 m aprovada.", 15500, 12000, 8000)
        ],
        "Pintura y Cuidado de Superficies": [
            ("Pintura Látex Interior Blanca 20L", "Látex antihongos de excelente poder cubritivo y terminación mate.", 65000, 52000, 41000),
            ("Pincel Cerda Blanca Nº 20", "Pincel tradicional cerda blanca virola de chapa.", 4500, 3500, 2200)
        ],
        "Tornillería, Clavos y Fijaciones": [
            ("Clavos Punta Paris 2 Pulgadas (1 Kg)", "Clavos punta paris de hierro de calidad.", 5200, 4100, 3000),
            ("Tornillo T1 Autoperforante (x 100u)", "Tornillos autoperforantes cabeza tanque phillips.", 2500, 1900, 1200)
        ],
        "Jardinería y Aire Libre": [
            ("Manguera de Riego 1/2 Trama 25m", "Manguera reforzada tramada resistente a la intemperie.", 18000, 14500, 10000),
            ("Tijera de Podar 8 Pulgadas", "Tijera forjada podadora para jardín.", 8500, 6800, 4500)
        ],
        "Seguridad Industrial y Ropa de Trabajo": [
            ("Guantes de Látex Moteados (Par)", "Guante algodon con elástico y pintas en palma anti-deslizante.", 1200, 900, 650),
            ("Anteojos de Seguridad Transparentes", "Lente protección de policarbonato alto impacto.", 3500, 2500, 1800)
        ],
        "Adhesivos, Selladores y Cintas": [
            ("Sellador de Silicona Transparente 280ml", "Sellador silicona de uso general.", 7500, 6000, 4200),
            ("Cinta de Enmascarar 24mm x 50m", "Cinta de papel fácil de remover.", 2800, 2200, 1500)
        ],
        "Cerrajería y Herrajes": [
            ("Candado de Bronce 30mm", "Candado blindado de bronce macizo, doble traba.", 6500, 5200, 3600),
            ("Cerradura de Seguridad Doble Paleta", "Cerradura tradicional doble paleta para puerta principal.", 18500, 15000, 11000)
        ],
        "Automotor y Lubricantes": [
            ("Aceite Lubricante Multiuso Aerosol", "Aceite aflojatodo protector antioxidante 300g.", 4600, 3800, 2800),
            ("Shampoo Siliconado para Autos 1L", "Shampoo para lavado de carrocerías con efecto cera.", 4200, 3200, 2100)
        ],
        "Limpieza y Mantenimiento": [
            ("Escoba de Guineo Cerdas Duras", "Escoba premium ideal para exterior y polvo pesado.", 4500, 3600, 2500),
            ("Desengrasante Industrial Concentrado 5L", "Detergente desengrasante multiuso en frío.", 18500, 14500, 10000)
        ],
        "Abrasivos": [
            ("Lija al Agua Grano 150", "Hoja de lija al agua especial para masilla y pintura.", 600, 400, 250),
            ("Piedra de Afilar Doble Grano", "Corindón sintético grueso/fino para herramientas.", 4500, 3500, 2500)
        ],
        "Cables y Alambres": [
            ("Cable Unipolar 2.5mm Rojo (100m)", "Rollo de alambre de cobre revestido aislante ecológico IRAM.", 48000, 39000, 28000),
            ("Alambre de Fardo Recocido N16 (Kg)", "Alambre dulce negro ideal para atar hierros.", 3500, 2800, 2000)
        ],
        "Techado y Aislantes": [
            ("Membrana Asfáltica Aluminio 4mm 4x10", "Membrana autoprotegida con aluminio no craqueante.", 55000, 45000, 34000),
            ("Pintura Asfáltica Base Solvente 4L", "Imprimación asfáltica secado rápido.", 18000, 14500, 11000)
        ],
        "Baño y Cocina": [
            ("Grifería de Lavatorio Monocomando", "Canilla grifería monocomando metalizada cierre cerámico.", 32000, 26000, 19000),
            ("Tapa Asiento Inodoro Madera", "Tapa asiento standard con herrajes.", 22000, 18000, 12000)
        ],
        "Soldadura": [
            ("Electrodo 6013 2.5mm (Caja 5 Kg)", "Electrodo de rutilo acero al carbono de uso general.", 25000, 19000, 15000),
            ("Mascara Soldar Fotosensible", "Kit de marco y cristal automático fotosensible para protección UV/IR.", 35000, 28000, 21000)
        ],
        "Medición y Nivelación": [
            ("Cinta Métrica 5 Metros", "Flexómetro engomado con freno y correa.", 4500, 3500, 2400),
            ("Nivel de Aluminio Burbuja 60cm", "Nivel base fresada 3 gotas precisión 1.0mm/m.", 8500, 7000, 4800)
        ]
    }

    for tenant in tenants:
        print(f"--- Seeding products for schema '{tenant.schema_name}' ---")
        connection.set_tenant(tenant)
        added = 0
        total_products_attempted = 0
        
        for category_name, products in products_data.items():
            try:
                category = Category.objects.get(name=category_name)
            except Category.DoesNotExist:
                print(f"Warning: Category '{category_name}' not found. Skipping products for this category.")
                continue

            for p_name, p_desc, price_retail, price_wholesale, cost_price in products:
                total_products_attempted += 1
                
                # Check if product with same name exists to avoid duplication
                if Product.objects.filter(name=p_name).exists():
                    print(f"Already exists: {p_name}")
                    continue

                # Generate a unique SKU based on category initials or generic
                sku_prefix = "".join([word[0] for word in category_name.split() if word.strip()])[:3].upper()
                sku = generate_sku(sku_prefix)

                Product.objects.create(
                    category=category,
                    name=p_name,
                    sku=sku,
                    description=p_desc,
                    price_retail=price_retail,
                    price_wholesale=price_wholesale,
                    cost_price=cost_price,
                    stock_current=random.randint(10, 100),
                    stock_min=5,
                    is_active=True,
                    is_ecommerce=True
                )
                print(f"Created: {p_name} (SKU: {sku})")
                added += 1

        print(f"--- Seeding completed for {tenant.schema_name}. Added {added} new products. ---\n")

if __name__ == "__main__":
    seed_products()
