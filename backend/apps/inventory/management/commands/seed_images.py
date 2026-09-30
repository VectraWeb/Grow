import os
import urllib.request
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from apps.inventory.models import Product
from apps.ecommerce.models import Banner

GROW_BANNER_DATA = [
    {
        "title": "Cultivo Indoor Premium",
        "subtitle": "Carpas, iluminación Quantum Board y ventilación profesional",
        "url": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=80",
        "position": 0,
    },
    {
        "title": "Nutrición y Fertilizantes",
        "subtitle": "Las mejores marcas para vegetación y floración explosiva",
        "url": "https://images.unsplash.com/photo-1592417817098-8f3d69102456?w=1200&q=80",
        "position": 1,
    },
    {
        "title": "Sustratos Orgánicos",
        "subtitle": "Growmix, perlita, fibra de coco y mezclas listas para usar",
        "url": "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200&q=80",
        "position": 2,
    },
]

class Command(BaseCommand):
    help = "Carga banners e imágenes para Tierra Verde Grow"

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("=== CREANDO BANNERS TIERRA VERDE GROW ==="))
        banners_created = 0
        for bdata in GROW_BANNER_DATA:
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
