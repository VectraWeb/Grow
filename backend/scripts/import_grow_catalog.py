import os
import sys
import argparse
import requests
import io
import re
from decimal import Decimal
import openpyxl
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferre_saas.settings')
django.setup()

from django.utils.text import slugify
from apps.inventory.models import Category, Product

DEFAULT_LOCAL_FILE = "/home/ariel/Unity/Grow/Tierra Verde Gestion 2026-06-04-1.xlsx"
FALLBACK_LOCAL_FILE = "/home/ariel/Descargas/Tierra Verde Gestion 2026-06-04-1.xlsx"
DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/17yIhDzBuelorQm9XrK4SMZ-uxwNzHnEX/edit?gid=1698636734#gid=1698636734"

# Categorías estándar de Tierra Verde con su orden visual
CATEGORIES_CONFIG = [
    ('Sustratos y Tierras', 1),
    ('Fertilizantes y Nutrientes', 2),
    ('Semillas', 3),
    ('Carpas e Indoor', 4),
    ('Iluminación LED', 5),
    ('Ventilación y Filtros', 6),
    ('Macetas y Riego', 7),
    ('Control y Medición', 8),
    ('Parafernalia y Accesorios', 9),
]

CATEGORY_MAPPING = {
    'sustratos': 'Sustratos y Tierras',
    'sustratos y tierras': 'Sustratos y Tierras',
    'fertilizantes y plaguicidas': 'Fertilizantes y Nutrientes',
    'fertilizantes y nutrientes': 'Fertilizantes y Nutrientes',
    'semillas': 'Semillas',
    'carpas e indoor': 'Carpas e Indoor',
    'luces': 'Iluminación LED',
    'iluminacion led': 'Iluminación LED',
    'iluminación led': 'Iluminación LED',
    'ventilacion y filtros': 'Ventilación y Filtros',
    'ventilación y filtros': 'Ventilación y Filtros',
    'macetas': 'Macetas y Riego',
    'macetas y riego': 'Macetas y Riego',
    'herramientas y medición': 'Control y Medición',
    'herramientas y medicion': 'Control y Medición',
    'control y medición': 'Control y Medición',
    'control y medicion': 'Control y Medición',
    'parafernalia': 'Parafernalia y Accesorios',
    'parafernalia y accesorios': 'Parafernalia y Accesorios',
}

def extract_sheet_id_and_gid(url):
    sheet_id_match = re.search(r'/d/([a-zA-Z0-9-_]+)', url)
    gid_match = re.search(r'[#&?]gid=([0-9]+)', url)
    sheet_id = sheet_id_match.group(1) if sheet_id_match else None
    gid = gid_match.group(1) if gid_match else "0"
    return sheet_id, gid

def download_google_sheet(url):
    sheet_id, gid = extract_sheet_id_and_gid(url)
    if not sheet_id:
        raise ValueError(f"No se pudo extraer el ID de la hoja desde la URL: {url}")
    
    export_xlsx_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx"
    print(f"📥 Intentando descargar Google Sheet desde: {export_xlsx_url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    resp = requests.get(export_xlsx_url, headers=headers, timeout=20, allow_redirects=True)
    
    if "ServiceLogin" in resp.url or resp.status_code != 200 or "html" in resp.headers.get('Content-Type', ''):
        raise PermissionError(
            "La hoja de Google Sheets está en modo 'Restringido' o requiere inicio de sesión.\n"
            "Para permitir la sincronización directa, debes entrar al Google Sheet, hacer clic en "
            "'Compartir' y cambiar 'Acceso general' a 'Cualquier persona que tenga el vínculo' (Lector)."
        )
    
    return io.BytesIO(resp.content)

def load_products_from_workbook(wb):
    sheet_name = 'Inventario' if 'Inventario' in wb.sheetnames else wb.sheetnames[0]
    sheet = wb[sheet_name]
    print(f"📄 Leyendo hoja: '{sheet_name}'...")

    header_row_idx = 4
    for r in range(1, 10):
        val = str(sheet.cell(r, 2).value or '').lower()
        if 'producto' in val or 'descrip' in val or 'nombre' in val:
            header_row_idx = r
            break

    raw_items = {}
    seen_skus = set()
    sku_counter = 1

    for r in range(header_row_idx + 1, sheet.max_row + 1):
        code_val = sheet.cell(r, 1).value
        name_val = sheet.cell(r, 2).value
        cat_val = sheet.cell(r, 3).value
        dist_val = sheet.cell(r, 4).value
        cost_val = sheet.cell(r, 5).value
        margin_val = sheet.cell(r, 6).value
        price_val = sheet.cell(r, 7).value
        stock_val = sheet.cell(r, 8).value

        if not name_val or not str(name_val).strip():
            continue

        name = str(name_val).strip()
        raw_cat = str(cat_val).strip().lower() if cat_val and str(cat_val).strip() and str(cat_val).strip() != 'None' else ''
        
        # In this sheet, rows 194+ without category belong to Parafernalia y Accesorios
        if not raw_cat and r >= 194:
            target_cat = 'Parafernalia y Accesorios'
        else:
            target_cat = CATEGORY_MAPPING.get(raw_cat, 'Parafernalia y Accesorios' if not raw_cat else raw_cat.title())

        dist = str(dist_val).strip() if dist_val else ''

        try:
            cost = Decimal(str(cost_val)) if cost_val is not None else Decimal('0.00')
        except Exception:
            cost = Decimal('0.00')

        try:
            price = Decimal(str(price_val)) if price_val is not None else Decimal('0.00')
        except Exception:
            price = Decimal('0.00')

        # If price is 0 but cost exists, apply default margin
        if price <= Decimal('0.00') and cost > Decimal('0.00'):
            price = cost * Decimal('2.00')

        try:
            stock = int(float(stock_val)) if stock_val is not None else 0
        except Exception:
            stock = 0

        # Clean code/SKU
        code = str(code_val).strip() if code_val and str(code_val).strip() and str(code_val).strip() != 'None' else ''
        
        # If code is duplicate or empty, generate a clean readable SKU
        if not code:
            cat_prefix = slugify(target_cat)[:3].upper()
            clean_name = slugify(name)[:16].upper()
            code = f"{cat_prefix}-{clean_name}"
            while code in seen_skus:
                code = f"{code}-{sku_counter}"
                sku_counter += 1

        # Check for duplicate code
        if code in raw_items:
            existing = raw_items[code]
            # If current row has price and existing had 0, replace with better data
            if existing['price'] <= Decimal('0.00') and price > Decimal('0.00'):
                raw_items[code] = {
                    'sku': code,
                    'name': name,
                    'category': target_cat,
                    'distributor': dist or existing['distributor'],
                    'cost': cost.quantize(Decimal('0.01')),
                    'price': price.quantize(Decimal('0.01')),
                    'wholesale_price': (price * Decimal('0.85')).quantize(Decimal('0.01')),
                    'stock': max(0, stock if stock > 0 else existing['stock']),
                }
            # Otherwise keep existing and skip duplicate
            continue

        seen_skus.add(code)

        # Calculate wholesale price (15% discount from retail)
        if price > Decimal('0.00'):
            wholesale_price = (price * Decimal('0.85')).quantize(Decimal('0.01'))
        elif cost > Decimal('0.00'):
            wholesale_price = (cost * Decimal('1.30')).quantize(Decimal('0.01'))
        else:
            wholesale_price = Decimal('0.00')

        raw_items[code] = {
            'sku': code,
            'name': name,
            'category': target_cat,
            'distributor': dist,
            'cost': cost.quantize(Decimal('0.01')),
            'price': price.quantize(Decimal('0.01')),
            'wholesale_price': wholesale_price,
            'stock': max(0, stock),
        }

    return list(raw_items.values())

def import_catalog(source_file_or_stream, clear_mock=False, dry_run=False):
    wb = openpyxl.load_workbook(source_file_or_stream, data_only=True)
    items = load_products_from_workbook(wb)
    print(f"📦 Total de productos procesados y listos: {len(items)}")

    if dry_run:
        print("\n🔍 Modo DRY-RUN activo. Mostrando muestra de productos:")
        for it in items[:15]:
            print(f"  [{it['sku']}] {it['name']} ({it['category']}) - Minorista: ${it['price']} | Mayorista: ${it['wholesale_price']} | Stock: {it['stock']}")
        print(f"✅ Dry-run finalizado sin modificar la base de datos ({len(items)} productos listos para importar).")
        return

    # 1. Configurar y asegurar categorías completas
    print("\n🏷️ Configurando categorías de la tienda...")
    cat_map = {}
    for name, order in CATEGORIES_CONFIG:
        cat, _ = Category.objects.update_or_create(
            name=name,
            defaults={'display_order': order}
        )
        cat_map[name] = cat

    # 2. Opcional: Limpiar productos de prueba anteriores
    if clear_mock:
        print("🧹 Limpiando productos anteriores...")
        Product.objects.all().delete()

    # 3. Cargar / Actualizar productos
    print("\n🌿 Sincronizando productos en la base de datos...")
    created_count = 0
    updated_count = 0

    for item in items:
        cat_name = item['category']
        if cat_name not in cat_map:
            cat, _ = Category.objects.get_or_create(name=cat_name, defaults={'display_order': 99})
            cat_map[cat_name] = cat
        else:
            cat = cat_map[cat_name]

        product, created = Product.objects.update_or_create(
            sku=item['sku'],
            defaults={
                'name': item['name'],
                'category': cat,
                'description': f"{item['name']}. Calidad garantizada para cultivo en Tierra Verde Growshop.",
                'cost_price': item['cost'],
                'price_retail': item['price'],
                'price_wholesale': item['wholesale_price'],
                'stock_current': item['stock'],
                'stock_min': 2,
                'brand': item['distributor'] or 'Tierra Verde',
                'is_active': True,
                'is_ecommerce': True,
            }
        )
        if created:
            created_count += 1
        else:
            updated_count += 1

    print(f"\n🎉 Sincronización finalizada con éxito:")
    print(f"  ✨ Nuevos productos creados: {created_count}")
    print(f"  🔄 Productos actualizados: {updated_count}")
    print(f"  📊 Total de productos en catálogo activo: {Product.objects.count()}")

def main():
    parser = argparse.ArgumentParser(description="Actualizar catálogo de Tierra Verde Grow")
    parser.add_argument('--url', help="URL de Google Sheets", default=None)
    parser.add_argument('--file', help="Ruta de archivo Excel local (.xlsx)", default=None)
    parser.add_argument('--clear', action='store_true', help="Borrar catálogo anterior antes de importar")
    parser.add_argument('--dry-run', action='store_true', help="Solo verificar sin guardar en base de datos")

    args = parser.parse_args()

    stream_or_path = None
    
    if args.url:
        try:
            stream_or_path = download_google_sheet(args.url)
        except Exception as e:
            print(f"❌ Error al acceder a Google Sheets: {e}")
            sys.exit(1)
    elif args.file:
        stream_or_path = args.file
    else:
        # Check files in local paths
        if os.path.exists(DEFAULT_LOCAL_FILE):
            print(f"📂 Archivo detectado en el proyecto: {DEFAULT_LOCAL_FILE}")
            stream_or_path = DEFAULT_LOCAL_FILE
        elif os.path.exists(FALLBACK_LOCAL_FILE):
            print(f"📂 Archivo detectado en Descargas: {FALLBACK_LOCAL_FILE}")
            stream_or_path = FALLBACK_LOCAL_FILE
        else:
            print("🌐 Intentando conectar a Google Sheets...")
            try:
                stream_or_path = download_google_sheet(DEFAULT_SHEET_URL)
            except Exception as e:
                print(f"❌ {e}")
                sys.exit(1)

    import_catalog(stream_or_path, clear_mock=args.clear, dry_run=args.dry_run)

if __name__ == '__main__':
    main()
