import os
import sys
import django
import shutil

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'grow_saas.settings')
django.setup()

from django.conf import settings
from apps.inventory.models import Category, Product
from apps.ecommerce.models import Banner

def seed():
    print("🌱 Iniciando seed para Tierra Verde Grow...")

    # Media destination folders
    banners_media_dir = os.path.join(settings.MEDIA_ROOT, 'banners')
    os.makedirs(banners_media_dir, exist_ok=True)

    frontend_assets_dir = os.path.join(settings.BASE_DIR.parent, 'frontend', 'src', 'assets')

    # 1. Seed Banners
    Banner.objects.all().delete()
    banner_files = [
        ("Cultivo Indoor Pro", "Luminarias LED Quantum Board y carpas de alta reflectancia", "banner_indoor_grow.jpg", 1),
        ("Nutrición & Sustratos", "Fertilizantes orgánicos, bioestimulantes y mezclas profesionales", "banner_nutrients.jpg", 2),
        ("Equipamiento Completo", "Turbinas, filtros de carbón, tijeras y accesorios de precisión", "banner_complete_kit.jpg", 3),
    ]

    for title, subtitle, filename, pos in banner_files:
        src = os.path.join(frontend_assets_dir, filename)
        dst = os.path.join(banners_media_dir, filename)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            media_rel_path = f"banners/{filename}"
            Banner.objects.create(
                title=title,
                subtitle=subtitle,
                image=media_rel_path,
                position=pos,
                is_active=True
            )
            print(f"  ✅ Banner creado: {title}")
        else:
            print(f"  ⚠️ Archivo no encontrado: {src}")

    # 2. Seed Categories
    # Clear old categories
    Category.objects.all().delete()
    Product.objects.all().delete()

    categories_data = [
        ("Sustratos y Tierras", 1),
        ("Fertilizantes y Nutrientes", 2),
        ("Carpas e Indoor", 3),
        ("Iluminación LED", 4),
        ("Ventilación y Filtros", 5),
        ("Macetas y Riego", 6),
        ("Control y Medición", 7),
        ("Parafernalia y Accesorios", 8)
    ]

    cat_map = {}
    for name, order in categories_data:
        cat = Category.objects.create(name=name, display_order=order)
        cat_map[name] = cat
        print(f"  ✅ Categoría creada: {name}")

    # 3. Seed Products
    products = [
        # Sustratos y Tierras
        (
            "Sustratos y Tierras",
            "Sustrato Profesional Growmix Multipro 80L",
            "SUST-GMIX-80L",
            "Sustrato profesional formulado con turba de musgo Sphagnum, perlita expandida y compost orgánico. Óptima retención de agua y excelente porosidad de aire.",
            28500, 23000, 17000, 45, "Terrafertil", "80 Litros", "55x35x20 cm", 10,
            "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80"
        ),
        (
            "Sustratos y Tierras",
            "Humus de Lombriz Californiana Puro 10L",
            "SUST-HUMUS-10L",
            "Abono 100% orgánico y ecológico de máxima pureza. Aporta flora microbiana benéfica, ácidos húmicos y fúlvicos para un desarrollo radicular explosivo.",
            7800, 6200, 4500, 60, "Santa Planta", "10 Litros", "30x20x10 cm", 0,
            "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80"
        ),
        # Fertilizantes y Nutrientes
        (
            "Fertilizantes y Nutrientes",
            "Fertilizante Orgánico Top Crop - Top Veg 1L",
            "FERT-TOPVEG-1L",
            "Fertilizante líquido completo rico en ácidos húmicos y fúlvicos, además de macro y micronutrientes solubles en agua. Fortalece las defensas y el crecimiento vegetal.",
            18900, 15000, 11000, 35, "Top Crop", "1 Litro", "25x8x8 cm", 0,
            "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&auto=format&fit=crop&q=80"
        ),
        (
            "Fertilizantes y Nutrientes",
            "Bioestimulante de Floración Big One Top Crop 250ml",
            "FERT-BIGONE-250",
            "Estimulador de floración formulado a base de extracto de algas marinas Kelp. Incrementa el volumen de las flores hasta un 40% y la producción de resina y terpenos.",
            22400, 18000, 13500, 30, "Top Crop", "250 ml", "15x6x6 cm", 15,
            "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"
        ),
        (
            "Fertilizantes y Nutrientes",
            "Enraizante Orgánico Deeper Underground 250ml",
            "FERT-DEEPER-250",
            "Estimulador del crecimiento radicular de origen 100% biológico. Estimula el desarrollo de raíces principales y pelos absorbentes en esquejes y plántulas.",
            14500, 11800, 8500, 40, "Top Crop", "250 ml", "15x6x6 cm", 0,
            "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&auto=format&fit=crop&q=80"
        ),
        # Iluminación LED
        (
            "Iluminación LED",
            "Panel LED Quantum Board Samsung LM301H 240W",
            "LED-QB-240W",
            "Panel LED de alta gama con diodos Samsung LM301H EVO y rojos lejanos Deep Red 660nm. Driver MeanWell con dimmer regulable. Eficiencia PAR de 2.8 umol/J.",
            285000, 240000, 190000, 12, "Samsung Grow Pro", "3.2 kg", "60x24x5 cm", 12,
            "https://images.unsplash.com/photo-1508873696983-2df570464756?w=600&auto=format&fit=crop&q=80"
        ),
        (
            "Iluminación LED",
            "Lámpara LED Full Spectrum 150W Cultivo Indoor",
            "LED-FS-150W",
            "Luminaria full spectrum ideal para carpas 60x60 o apoyo vegetativo. Disipador de aluminio pasivo sin ruido, bajo consumo y alta penetración lumínica.",
            145000, 120000, 95000, 18, "Quantum Light", "2.1 kg", "30x30x4 cm", 0,
            "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80"
        ),
        # Carpas e Indoor
        (
            "Carpas e Indoor",
            "Carpa de Cultivo Indoor 80x80x160cm Mylar 600D",
            "CARP-80-80-160",
            "Armario de cultivo hermético con tela Oxford 600D ultra resistente y revestimiento interno de Mylar granulado con 98% de reflectancia. Estructura de caños de acero.",
            145000, 122000, 98000, 10, "Magic Box Pro", "7.5 kg", "80x80x160 cm", 0,
            "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80"
        ),
        (
            "Carpas e Indoor",
            "Carpa de Cultivo Indoor 100x100x200cm Mylar 600D",
            "CARP-100-100-200",
            "Carpa profesional para hasta 9 plantas en macetas de 11L a 15L. Doble fondo impermeable, mangas ajustables para ventilación y cierres reforzados a prueba de luz.",
            195000, 165000, 130000, 8, "Magic Box Pro", "10.2 kg", "100x100x200 cm", 5,
            "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80"
        ),
        # Ventilación y Filtros
        (
            "Ventilación y Filtros",
            "Extractor Turbina Lineal 4 Pulgadas (100mm) 220V",
            "VENT-TURB-4P",
            "Extractor centrífugo lineal de alta presión estática. Silencioso y apto para funcionamiento continuo 24/7. Caudal de 190 m3/h, ideal para carpas hasta 100x100.",
            42000, 35000, 27000, 20, "Turbonex", "1.4 kg", "20x15x15 cm", 5,
            "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80"
        ),
        (
            "Ventilación y Filtros",
            "Filtro de Carbón Activado Antiolor Pro 4 Pulgadas",
            "VENT-FILT-4P",
            "Filtro cilíndrico relleno de carbón activado virgen 100% australiano RC-48. Elimina hasta el 99.8% de los olores del cultivo durante la fase de floración.",
            48500, 41000, 31000, 15, "PureFilter", "2.8 kg", "30x18 cm", 0,
            "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80"
        ),
        # Macetas y Riego
        (
            "Macetas y Riego",
            "Maceta Geotextil de Tela 15 Litros con Asas",
            "MAC-GEO-15L",
            "Maceta de tela no tejida geotextil transpirable. Favorece la autopoda aérea radicular evitando raíces circulares y mejorando la asimilación de nutrientes.",
            4200, 3400, 2400, 150, "Tierra Verde Geotextil", "15 Litros", "28x25 cm", 0,
            "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80"
        ),
        # Control y Medición
        (
            "Control y Medición",
            "Medidor Digital de pH Sumergible con Calibrador",
            "MED-PH-DIG",
            "Medidor electrónico digital de pH con compensación automática de temperatura (ATC) y resolución de 0.01 pH. Incluye sobres buffer para calibración.",
            18500, 15000, 10500, 30, "Hanna Style", "150 g", "15x3 cm", 10,
            "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&auto=format&fit=crop&q=80"
        ),
        (
            "Control y Medición",
            "Termohigrómetro Digital con Sonda Externa Max/Min",
            "MED-TERM-SOND",
            "Mide temperatura y humedad ambiental de la carpa y temperatura en canopia mediante sonda con cable de 1.5m. Memoria de temperaturas máximas y mínimas.",
            12800, 10200, 7200, 45, "HTC-2", "200 g", "10x10 cm", 0,
            "https://images.unsplash.com/photo-1584267385494-9fdd9a71ad75?w=600&auto=format&fit=crop&q=80"
        ),
        # Parafernalia y Accesorios
        (
            "Parafernalia y Accesorios",
            "Picador Grinder Metálico 4 Partes con Tamiz",
            "PARAF-GRIND-4P",
            "Grinder picador de aleación de aluminio aeronáutico anodizado de 50mm. Cuatro piezas con dientes diamantados, malla tamizadora de polen y espátula raspadora.",
            16500, 13200, 9500, 60, "Tierra Verde Grow", "180 g", "5x5x4 cm", 15,
            "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80"
        ),
        (
            "Parafernalia y Accesorios",
            "Tijera de Poda y Manicura Curva Acero Inoxidable",
            "PARAF-TIJ-CURV",
            "Tijera de precisión para manicurado fino de cogollos y poda de hojas. Cuchillas curvas de acero inoxidable con muelle suave para evitar fatiga en mano.",
            8900, 7100, 5000, 50, "Bonsai Trim", "90 g", "16x5 cm", 0,
            "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80"
        ),
    ]

    for cat_name, name, sku, desc, price_ret, price_ws, cost, stock, brand, weight, dims, disc, img in products:
        p = Product.objects.create(
            category=cat_map[cat_name],
            name=name,
            sku=sku,
            description=desc,
            price_retail=price_ret,
            price_wholesale=price_ws,
            cost_price=cost,
            stock_current=stock,
            brand=brand,
            weight=weight,
            dimensions=dims,
            discount_percentage=disc,
            is_active=True,
            is_ecommerce=True
        )
        print(f"  🌿 Producto creado: {name} (${price_ret})")

    print(f"🎉 Seeding completado exitosamente: {len(products)} productos y {len(categories_data)} categorías.")

if __name__ == "__main__":
    seed()
