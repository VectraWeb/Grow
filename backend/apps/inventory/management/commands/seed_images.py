import os
import urllib.request
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from apps.inventory.models import Product
from apps.ecommerce.models import Banner

PRODUCT_IMAGES = {
    "HE-TAL-001": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",
    "HE-AMO-002": "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=800&q=80",
    "HE-SIE-003": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
    "HE-LIJ-004": "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80",
    "HE-ROT-005": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",
    "HE-CAL-006": "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80",
    "PL-LLV-001": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80",
    "PL-CTF-002": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
    "PL-GRF-003": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
    "PL-TUB-004": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
    "PL-ING-005": "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&q=80",
    "PL-SIF-006": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
    "PT-SIN-001": "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&q=80",
    "PT-ROL-002": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",
    "PT-BRC-003": "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&q=80",
    "PT-MAS-004": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",
    "PT-SLD-005": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
    "PT-IMR-006": "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&q=80",
    "MC-CPT-001": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    "MC-LAD-002": "https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=800&q=80",
    "MC-ARE-003": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    "MC-DUR-004": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    "MC-HRR-005": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    "MC-CTP-006": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    "EL-CBL-001": "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&q=80",
    "EL-LTH-002": "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&q=80",
    "EL-PAN-003": "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&q=80",
    "EL-CNO-004": "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&q=80",
    "EL-GAB-005": "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&q=80",
    "EL-FIC-006": "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&q=80",
}

BANNER_DATA = [
    {
        "title": "Herramientas Electricas",
        "subtitle": "Hasta 20% OFF en taladros, amoladoras y mas",
        "url": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&q=80",
        "position": 0,
    },
    {
        "title": "Materiales de Construccion",
        "subtitle": "Todo para tu obra al mejor precio",
        "url": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80",
        "position": 1,
    },
    {
        "title": "Plomeria y Electricidad",
        "subtitle": "Surtido completo para instalaciones",
        "url": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&q=80",
        "position": 2,
    },
]


class Command(BaseCommand):
    help = "Descarga fotos de productos y crea banners"

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("=== CARGANDO IMAGENES DE PRODUCTOS ==="))
        ok = 0
        skip = 0
        err = 0
        for sku, url in PRODUCT_IMAGES.items():
            try:
                product = Product.objects.get(sku=sku)
                if product.image:
                    self.stdout.write(f"  SKIP {sku} (ya tiene imagen)")
                    skip += 1
                    continue

                self.stdout.write(f"  Descargando {sku}...")
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=20) as response:
                    data = response.read()
                    fname = f"products/{sku}.jpg"
                    product.image.save(fname, ContentFile(data), save=True)
                    self.stdout.write(f"    OK {sku}")
                    ok += 1
            except Product.DoesNotExist:
                self.stdout.write(f"  MISS {sku} no encontrado en la DB")
                err += 1
            except Exception as e:
                self.stdout.write(f"  ERR  {sku}: {e}")
                err += 1

        self.stdout.write(
            self.style.SUCCESS(f"Productos: {ok} imagenes subidas, {skip} ya tenian, {err} errores")
        )

        self.stdout.write(self.style.WARNING("\n=== CREANDO BANNERS ==="))
        banners_created = 0
        for bdata in BANNER_DATA:
            if Banner.objects.filter(title=bdata["title"]).exists():
                self.stdout.write(f"  SKIP '{bdata['title']}' (ya existe)")
                continue

            try:
                self.stdout.write(f"  Descargando banner: {bdata['title']}...")
                req = urllib.request.Request(bdata["url"], headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=20) as response:
                    img_data = response.read()
                    banner = Banner(
                        title=bdata["title"],
                        subtitle=bdata["subtitle"],
                        position=bdata["position"],
                        is_active=True,
                    )
                    banner.image.save(f"banners/{bdata['position']}.jpg", ContentFile(img_data), save=True)
                    banners_created += 1
                    self.stdout.write(f"    OK: {bdata['title']}")
            except Exception as e:
                self.stdout.write(f"  ERR  banner '{bdata['title']}': {e}")

        self.stdout.write(
            self.style.SUCCESS(f"Banners: {banners_created} creados")
        )
        self.stdout.write(self.style.SUCCESS("\nListo! Todo subido a Cloudinary."))
