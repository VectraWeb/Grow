import re
import csv
import io
import requests
import unicodedata
from decimal import Decimal, InvalidOperation
from django.db import transaction, models
from django.utils.text import slugify

from apps.inventory.models import Product, Category
from apps.users.models import StoreConfig
from apps.integrations.models import IntegrationConfig


class GoogleSheetsAccessError(Exception):
    """Raised when Google Sheet cannot be accessed (e.g. private/restricted)."""
    pass


class GoogleSheetsSyncService:
    DEFAULT_HEADERS_SYNONYMS = {
        'sku': ['sku', 'codigo', 'cod', 'id', 'ref', 'referencia', 'articulo_id', 'cod_prod', 'codigo_barra'],
        'name': ['nombre', 'producto', 'articulo', 'titulo', 'item', 'descripcion_corta', 'denominacion'],
        'price_retail': ['precio_venta', 'precio', 'precio_retail', 'precio_minorista', 'pvp', 'precio_lista', 'valor', 'precio_final', 'venta'],
        'price_wholesale': ['precio_mayorista', 'mayorista', 'precio_wholesale', 'precio_distribuidor', 'gremio', 'precio_gremio'],
        'cost_price': ['costo_unit', 'costo_unitario', 'costo', 'precio_costo', 'cost_price', 'compra', 'precio_compra'],
        'stock_current': ['stock_actual', 'stock', 'cantidad', 'cant', 'stock_current', 'unidades', 'disponible', 'existencia', 'existencias', 'inventario'],
        'category': ['categoria', 'rubro', 'familia', 'tipo', 'seccion', 'linea', 'departamento'],
        'description': ['descripcion', 'detalle', 'observaciones', 'notas', 'info', 'especificaciones'],
        'brand': ['marca', 'brand', 'fabricante', 'laboratorio'],
        'is_active': ['activo', 'habilitado', 'visible', 'publicado'],
        'featured': ['destacado', 'oferta', 'promocion', 'estrella'],
        'image_url': ['imagen', 'foto', 'url_imagen', 'img', 'link_imagen']
    }

    STORE_INFO_KEYS = {
        'whatsapp': ['whatsapp', 'telefono', 'celular', 'contacto', 'whatsapp_number'],
        'address': ['direccion', 'local', 'ubicacion', 'domicilio', 'store_address'],
        'name': ['nombre_negocio', 'nombre_comercial', 'empresa', 'tienda', 'store_name'],
        'instagram': ['instagram', 'ig', 'instagram_url'],
        'facebook': ['facebook', 'fb', 'facebook_url'],
        'cuit': ['cuit', 'cuil', 'bank_cuit'],
        'titular': ['titular', 'titular_cuenta', 'bank_titular'],
        'alias': ['alias', 'alias_cbu', 'bank_alias'],
        'cvu': ['cvu', 'cbu', 'bank_cvu'],
    }

    @staticmethod
    def normalize_text(text: str) -> str:
        if not text:
            return ''
        text = str(text).strip().lower()
        # Remove accents
        text = ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
        # Replace spaces/hyphens with underscore
        text = re.sub(r'[\s\-_]+', '_', text)
        return text

    @staticmethod
    def parse_clean_decimal(value, default=Decimal('0.00')) -> Decimal:
        if value is None or str(value).strip() == '':
            return default
        val_str = str(value).strip()
        # Remove currency symbols and whitespace
        val_str = re.sub(r'[^\d.,\-]', '', val_str)
        if not val_str:
            return default
        
        # Argentine / European number format check: 1.500,00 vs US format 1,500.00
        if ',' in val_str and '.' in val_str:
            if val_str.rfind(',') > val_str.rfind('.'):
                # 1.500,00 -> 1500.00
                val_str = val_str.replace('.', '').replace(',', '.')
            else:
                # 1,500.00 -> 1500.00
                val_str = val_str.replace(',', '')
        elif ',' in val_str:
            # 1500,50 -> 1500.50
            val_str = val_str.replace(',', '.')

        try:
            return Decimal(val_str)
        except InvalidOperation:
            return default

    @staticmethod
    def parse_clean_int(value, default=0) -> int:
        if value is None:
            return default
        if isinstance(value, (int, float, Decimal)):
            return int(value)
        val_str = str(value).strip()
        if not val_str or val_str.lower() in ('none', 'null', '-', ''):
            return default
        try:
            return int(float(val_str.replace(',', '.')))
        except ValueError:
            val_clean = re.sub(r'[^\d\-]', '', val_str.split('.')[0].split(',')[0])
            try:
                return int(val_clean)
            except ValueError:
                return default

    @classmethod
    def extract_sheet_id_and_gid(cls, url: str):
        """Extracts Google Spreadsheet ID and GID from URL."""
        if not url:
            raise ValueError("URL no proporcionada.")

        # Match Google Docs spreadsheet or Google Drive file URL
        match = re.search(r'/(?:spreadsheets/d|file/d)/([a-zA-Z0-9-_]+)', url)
        if not match:
            match = re.search(r'[?&]id=([a-zA-Z0-9-_]+)', url)
        if not match:
            # If user provided raw ID
            if re.match(r'^[a-zA-Z0-9-_]{20,}$', url.strip()):
                sheet_id = url.strip()
            else:
                raise ValueError("URL de Google Sheets no válida. Asegúrate de copiar el enlace completo desde el navegador.")
        else:
            sheet_id = match.group(1)

        # Extract GID if present
        gid_match = re.search(r'[?&#]gid=([0-9]+)', url)
        gid = gid_match.group(1) if gid_match else None

        return sheet_id, gid

    @classmethod
    def parse_raw_rows_from_excel(cls, file_bytes: bytes, preferred_sheet: str = None):
        """Parses .xlsx file into raw rows using openpyxl with intelligent sheet selection."""
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
        
        target_sheet = None
        # 1. Preferred sheet by parameter
        if preferred_sheet and preferred_sheet in wb.sheetnames:
            target_sheet = wb[preferred_sheet]
        
        # 2. Look for sheets named matching inventory/catalog keywords
        if not target_sheet:
            for name in wb.sheetnames:
                if any(k in name.lower() for k in ['inventario', 'stock', 'producto', 'articulo', 'catalogo']):
                    target_sheet = wb[name]
                    break
        
        # 3. Score sheets by inspecting first 10 rows for product columns
        if not target_sheet:
            best_score = -1
            best_sheet = None
            for name in wb.sheetnames:
                ws = wb[name]
                score = 0
                for row in ws.iter_rows(max_row=10, values_only=True):
                    for cell in row:
                        if not cell:
                            continue
                        cell_norm = cls.normalize_text(cell)
                        if any(syn in cell_norm for syn in ['producto', 'nombre', 'articulo', 'codigo', 'sku', 'stock', 'precio']):
                            score += 1
                if score > best_score:
                    best_score = score
                    best_sheet = ws
            if best_score > 0 and best_sheet:
                target_sheet = best_sheet

        # 4. Fallback to active sheet
        if not target_sheet:
            target_sheet = wb.active

        raw_rows = []
        for row in target_sheet.iter_rows(values_only=True):
            str_row = [str(cell) if cell is not None else '' for cell in row]
            if any(cell.strip() for cell in str_row):
                raw_rows.append(str_row)
        return raw_rows

    @classmethod
    def fetch_raw_rows_from_url(cls, url: str):
        """Downloads data from Google Sheets URL handling permission checks and multi-sheet workbooks."""
        sheet_id, gid = cls.extract_sheet_id_and_gid(url)

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }

        # If GID is specified and not '0', try CSV export first
        if gid and gid != '0':
            export_csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
            try:
                resp = requests.get(export_csv_url, headers=headers, timeout=15, allow_redirects=True)
                if resp.status_code == 200 and '<html' not in resp.text.lower()[:300]:
                    rows = cls.parse_raw_rows_from_csv(resp.text)
                    h_idx, col_map, _, _ = cls.detect_structure(rows)
                    if col_map.get('name') or col_map.get('sku'):
                        return rows
            except Exception:
                pass

        # Fallback / Primary for multi-sheet workbooks: Download XLSX workbook
        export_xlsx_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx"
        try:
            response = requests.get(export_xlsx_url, headers=headers, timeout=25, allow_redirects=True)
            if response.status_code != 200:
                drive_url = f"https://drive.google.com/uc?export=download&id={sheet_id}"
                response = requests.get(drive_url, headers=headers, timeout=25, allow_redirects=True)
        except Exception as e:
            raise GoogleSheetsAccessError(f"Error de conexión al intentar acceder a Google Sheets: {str(e)}")

        final_url = response.url.lower()
        if response.status_code in (401, 403) or 'accounts.google.com' in final_url or 'servicelogin' in final_url:
            raise GoogleSheetsAccessError(
                "La hoja de cálculo está en modo privado o restringido en Google Drive.\n\n"
                "👉 Solución rápida (10 segundos):\n"
                "1. Abre la hoja en Google Sheets.\n"
                "2. Arriba a la derecha, haz clic en el botón azul 'Compartir'.\n"
                "3. En 'Acceso general', cambia de 'Restringido' a 'Cualquier persona con el enlace' (con permiso 'Lector').\n"
                "4. Vuelve a hacer clic en Sincronizar."
            )

        if response.status_code != 200 or len(response.content) < 500:
            raise GoogleSheetsAccessError(f"Error {response.status_code} al consultar Google Sheets.")

        content = response.content
        if content[:4] == b'PK\x03\x04':
            return cls.parse_raw_rows_from_excel(content)
        else:
            return cls.parse_raw_rows_from_csv(response.text)

    @classmethod
    def fetch_csv_from_url(cls, url: str) -> str:
        """Deprecated: kept for backward compatibility."""
        sheet_id, gid = cls.extract_sheet_id_and_gid(url)
        gid = gid or '0'
        export_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(export_url, headers=headers, timeout=15, allow_redirects=True)
        if response.status_code != 200:
            raise GoogleSheetsAccessError(f"Error {response.status_code} al consultar Google Sheets.")
        return response.text

    @classmethod
    def parse_raw_rows_from_csv(cls, csv_text: str):
        """Parses CSV text into a list of list of string values."""
        if csv_text.startswith('\ufeff'):
            csv_text = csv_text[1:]

        first_lines = csv_text[:4096]
        delimiter = ','
        if first_lines.count(';') > first_lines.count(','):
            delimiter = ';'
        elif first_lines.count('\t') > first_lines.count(','):
            delimiter = '\t'

        reader = csv.reader(io.StringIO(csv_text), delimiter=delimiter)
        raw_rows = [row for row in reader if any(cell.strip() for cell in row)]
        return raw_rows

    @classmethod
    def detect_structure(cls, raw_rows):
        """
        Finds header row index, maps columns to fields, and detects business info.
        """
        if not raw_rows:
            return None, {}, {}, []

        header_index = -1
        column_mapping = {} # canonical_field -> column_index
        store_info = {}

        # Look for header row in the first 15 rows
        for i, row in enumerate(raw_rows[:15]):
            normalized_cells = [cls.normalize_text(cell) for cell in row]
            
            # Check for Store Info key-value format (e.g. Row with "WhatsApp", "+54911...")
            if len(row) >= 2 and not column_mapping:
                k_norm = normalized_cells[0]
                val = str(row[1]).strip()
                for store_field, syns in cls.STORE_INFO_KEYS.items():
                    if any(syn in k_norm for syn in syns) and val:
                        store_info[store_field] = val

            # Check if this row looks like a table header
            matches = {}
            for col_idx, cell_norm in enumerate(normalized_cells):
                if not cell_norm:
                    continue
                for canon_field, syns in cls.DEFAULT_HEADERS_SYNONYMS.items():
                    if canon_field in matches:
                        continue
                    if any(syn == cell_norm or cell_norm.startswith(syn) or syn in cell_norm for syn in syns):
                        matches[canon_field] = col_idx
                        break

            # If row matches at least 'name' or 'price_retail' or 'sku', it's a good header candidate
            if ('name' in matches or 'price_retail' in matches) and len(matches) >= 2:
                header_index = i
                column_mapping = matches
                break

        # Fallback if no explicit header row found: assume first row is header
        if header_index == -1 and raw_rows:
            header_index = 0
            for col_idx, cell in enumerate(raw_rows[0]):
                cell_norm = cls.normalize_text(cell)
                for canon_field, syns in cls.DEFAULT_HEADERS_SYNONYMS.items():
                    if canon_field in column_mapping:
                        continue
                    if any(syn in cell_norm for syn in syns):
                        column_mapping[canon_field] = col_idx

        data_rows = raw_rows[header_index + 1:] if header_index != -1 else []
        return header_index, column_mapping, store_info, data_rows

    @classmethod
    def preview(cls, source_type: str, source_data: str | bytes):
        """
        Extracts and previews products and store info without modifying the database.
        source_type: 'url', 'csv_text', or 'excel_bytes'
        """
        if source_type == 'url':
            raw_rows = cls.fetch_raw_rows_from_url(source_data)
        elif source_type == 'csv_text':
            raw_rows = cls.parse_raw_rows_from_csv(source_data)
        elif source_type == 'excel_bytes':
            raw_rows = cls.parse_raw_rows_from_excel(source_data)
        else:
            raise ValueError(f"Tipo de fuente desconocido: {source_type}")

        header_index, col_map, store_info, data_rows = cls.detect_structure(raw_rows)

        # Parse data rows into preview product items
        parsed_products = []
        to_create_count = 0
        to_update_count = 0

        existing_skus = set(Product.objects.values_list('sku', flat=True))
        existing_names = {name.lower(): sku for name, sku in Product.objects.values_list('name', 'sku')}

        for r_idx, row in enumerate(data_rows):
            name_val = row[col_map['name']].strip() if 'name' in col_map and col_map['name'] < len(row) else ''
            if not name_val:
                continue

            sku_val = row[col_map['sku']].strip() if 'sku' in col_map and col_map['sku'] < len(row) else ''
            price_val = row[col_map['price_retail']].strip() if 'price_retail' in col_map and col_map['price_retail'] < len(row) else '0'
            stock_val = row[col_map['stock_current']].strip() if 'stock_current' in col_map and col_map['stock_current'] < len(row) else '0'
            cat_val = row[col_map['category']].strip() if 'category' in col_map and col_map['category'] < len(row) else 'General'
            brand_val = row[col_map['brand']].strip() if 'brand' in col_map and col_map['brand'] < len(row) else ''
            desc_val = row[col_map['description']].strip() if 'description' in col_map and col_map['description'] < len(row) else ''

            price_dec = cls.parse_clean_decimal(price_val)
            stock_int = cls.parse_clean_int(stock_val)

            # Auto-generate SKU if empty
            if not sku_val:
                sku_val = f"TVG-{slugify(name_val)[:30].upper()}"

            is_update = (sku_val in existing_skus) or (name_val.lower() in existing_names)
            if is_update:
                to_update_count += 1
            else:
                to_create_count += 1

            if len(parsed_products) < 10:
                parsed_products.append({
                    'sku': sku_val,
                    'name': name_val,
                    'price_retail': float(price_dec),
                    'stock_current': stock_int,
                    'category': cat_val or 'General',
                    'brand': brand_val,
                    'description': desc_val,
                    'action': 'Actualizar' if is_update else 'Crear nuevo'
                })

        return {
            'total_rows': len(data_rows),
            'header_row_index': header_index,
            'columns_detected': {k: raw_rows[header_index][idx] for k, idx in col_map.items() if idx < len(raw_rows[header_index])},
            'sample_products': parsed_products,
            'summary': {
                'to_create': to_create_count,
                'to_update': to_update_count,
                'total_valid': to_create_count + to_update_count
            },
            'store_info_detected': store_info
        }

    @classmethod
    def sync(cls, source_type: str, source_data: str | bytes, update_store_info: bool = True):
        """
        Executes synchronization of products and store info into the database.
        """
        if source_type == 'url':
            raw_rows = cls.fetch_raw_rows_from_url(source_data)
            sheet_url = source_data
        elif source_type == 'csv_text':
            raw_rows = cls.parse_raw_rows_from_csv(source_data)
            sheet_url = ''
        elif source_type == 'excel_bytes':
            raw_rows = cls.parse_raw_rows_from_excel(source_data)
            sheet_url = ''
        else:
            raise ValueError(f"Tipo de fuente desconocido: {source_type}")

        header_index, col_map, store_info, data_rows = cls.detect_structure(raw_rows)

        if not col_map.get('name') and not col_map.get('sku'):
            raise ValueError("No se pudo detectar la columna de Nombre o SKU del producto en la hoja.")

        created_count = 0
        updated_count = 0
        errors = []

        # Cache existing categories and products
        categories_cache = {c.name.lower(): c for c in Category.objects.all()}
        default_cat = categories_cache.get('general')
        if not default_cat:
            default_cat = Category.objects.create(name='General')
            categories_cache['general'] = default_cat

        with transaction.atomic():
            # Update store info if found
            if update_store_info and store_info:
                store_cfg = StoreConfig.objects.first()
                if not store_cfg:
                    store_cfg = StoreConfig.objects.create(name="Tierra Verde Grow")
                
                if 'whatsapp' in store_info:
                    store_cfg.whatsapp_number = store_info['whatsapp']
                if 'address' in store_info:
                    store_cfg.store_address = store_info['address']
                if 'name' in store_info:
                    store_cfg.name = store_info['name']
                if 'instagram' in store_info:
                    store_cfg.instagram_url = store_info['instagram']
                if 'facebook' in store_info:
                    store_cfg.facebook_url = store_info['facebook']
                if 'cuit' in store_info:
                    store_cfg.bank_cuit = store_info['cuit']
                if 'titular' in store_info:
                    store_cfg.bank_titular = store_info['titular']
                if 'alias' in store_info:
                    store_cfg.bank_alias = store_info['alias']
                if 'cvu' in store_info:
                    store_cfg.bank_cvu = store_info['cvu']
                store_cfg.save()

            for r_idx, row in enumerate(data_rows):
                try:
                    name_val = row[col_map['name']].strip() if 'name' in col_map and col_map['name'] < len(row) else ''
                    if not name_val:
                        continue

                    sku_val = row[col_map['sku']].strip() if 'sku' in col_map and col_map['sku'] < len(row) else ''
                    price_val = row[col_map['price_retail']].strip() if 'price_retail' in col_map and col_map['price_retail'] < len(row) else '0'
                    stock_val = row[col_map['stock_current']].strip() if 'stock_current' in col_map and col_map['stock_current'] < len(row) else '0'
                    cat_val = row[col_map['category']].strip() if 'category' in col_map and col_map['category'] < len(row) else ''
                    brand_val = row[col_map['brand']].strip() if 'brand' in col_map and col_map['brand'] < len(row) else ''
                    desc_val = row[col_map['description']].strip() if 'description' in col_map and col_map['description'] < len(row) else ''
                    cost_val = row[col_map['cost_price']].strip() if 'cost_price' in col_map and col_map['cost_price'] < len(row) else '0'
                    wholesale_val = row[col_map['price_wholesale']].strip() if 'price_wholesale' in col_map and col_map['price_wholesale'] < len(row) else '0'

                    price_dec = cls.parse_clean_decimal(price_val)
                    stock_int = cls.parse_clean_int(stock_val)
                    cost_dec = cls.parse_clean_decimal(cost_val)
                    wholesale_dec = cls.parse_clean_decimal(wholesale_val, default=price_dec)

                    # Category handling
                    target_category = default_cat
                    if cat_val:
                        cat_clean = cat_val.strip()
                        cat_slug = slugify(cat_clean)
                        # Check cache by clean name, lower name, or slug
                        if cat_clean.lower() in categories_cache:
                            target_category = categories_cache[cat_clean.lower()]
                        elif cat_slug in categories_cache:
                            target_category = categories_cache[cat_slug]
                        else:
                            # Check database
                            existing = Category.objects.filter(models.Q(name__iexact=cat_clean) | models.Q(slug=cat_slug)).first()
                            if existing:
                                target_category = existing
                            else:
                                # Ensure slug uniqueness
                                unique_slug = cat_slug
                                counter = 2
                                while Category.objects.filter(slug=unique_slug).exists():
                                    unique_slug = f"{cat_slug}-{counter}"
                                    counter += 1
                                target_category = Category.objects.create(name=cat_clean, slug=unique_slug)
                            categories_cache[cat_clean.lower()] = target_category
                            categories_cache[cat_slug] = target_category

                    # Auto SKU if not present
                    if not sku_val:
                        sku_val = f"TVG-{slugify(name_val)[:30].upper()}"

                    # Product search: first by SKU, then by exact name
                    product = None
                    if sku_val:
                        product = Product.objects.filter(sku=sku_val).first()
                    if not product and name_val:
                        product = Product.objects.filter(name__iexact=name_val).first()

                    if product:
                        # Update product
                        product.name = name_val
                        if sku_val:
                            product.sku = sku_val
                        if price_dec > 0:
                            product.price_retail = price_dec
                        if wholesale_dec > 0:
                            product.price_wholesale = wholesale_dec
                        if cost_dec > 0:
                            product.cost_price = cost_dec
                        product.stock_current = stock_int
                        if desc_val:
                            product.description = desc_val
                        if brand_val:
                            product.brand = brand_val
                        if target_category:
                            product.category = target_category
                        product.is_active = True
                        product.save()
                        updated_count += 1
                    else:
                        # Create new product
                        Product.objects.create(
                            category=target_category,
                            name=name_val,
                            sku=sku_val,
                            description=desc_val or f"{name_val} - Tierra Verde Grow",
                            price_retail=price_dec,
                            price_wholesale=wholesale_dec or price_dec,
                            cost_price=cost_dec,
                            stock_current=stock_int,
                            brand=brand_val or "Tierra Verde Grow",
                            is_active=True,
                            is_ecommerce=True
                        )
                        created_count += 1

                except Exception as row_err:
                    errors.append(f"Fila {r_idx + 1}: {str(row_err)}")

            # Update or create IntegrationConfig record
            config, _ = IntegrationConfig.objects.get_or_create(
                integration_type='GOOGLE_SHEETS'
            )
            config.metadata = {
                'sheet_url': sheet_url,
                'last_sync_summary': {
                    'created': created_count,
                    'updated': updated_count,
                    'errors_count': len(errors),
                    'total': created_count + updated_count,
                    'store_info_updated': bool(store_info and update_store_info)
                }
            }
            config.save()

        return {
            'status': 'success',
            'created_count': created_count,
            'updated_count': updated_count,
            'total_processed': created_count + updated_count,
            'errors': errors[:10],
            'store_info_updated': bool(store_info and update_store_info)
        }
