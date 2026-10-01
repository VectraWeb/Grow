# Migración de rendimiento: índices de base de datos para el catálogo e-commerce.
# Estos índices aceleran las consultas más frecuentes de la tienda pública.
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0009_seed_catalog_data'),
    ]

    operations = [
        # Índice principal del catálogo — consulta más frecuente del e-commerce:
        # Product.objects.filter(is_active=True, is_ecommerce=True, stock_current__gt=0)
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['is_active', 'is_ecommerce', 'stock_current'],
                name='product_catalog_idx',
            ),
        ),
        # Para la sección "Destacados" del home
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['featured', 'is_active', 'is_ecommerce'],
                name='product_featured_idx',
            ),
        ),
        # Para filtrar por categoría en el catálogo
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['category', 'is_active', 'is_ecommerce', 'stock_current'],
                name='product_category_catalog_idx',
            ),
        ),
        # Para sync con Mercado Libre (Celery task)
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['meli_sync', 'is_active'],
                name='product_meli_sync_idx',
            ),
        ),
    ]
