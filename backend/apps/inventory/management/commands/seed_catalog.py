import os
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Seed catalog for Tierra Verde Growshop"

    def handle(self, *args, **options):
        from scripts.import_grow_catalog import import_catalog, DEFAULT_LOCAL_FILE
        self.stdout.write("Importando catálogo Tierra Verde Growshop...")
        if os.path.exists(DEFAULT_LOCAL_FILE):
            import_catalog(DEFAULT_LOCAL_FILE)
            self.stdout.write(self.style.SUCCESS("Catálogo de Growshop importado exitosamente."))
        else:
            from scripts.seed_growshop import seed
            seed()
            self.stdout.write(self.style.SUCCESS("Catálogo seed de Growshop importado exitosamente."))
