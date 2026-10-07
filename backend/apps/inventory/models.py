# Modelos del inventario: productos, categorías, stock y precios minorista/mayorista
# Gestiona SKU, inventario en tiempo real e información de distribución
from django.db import models
from django.utils import timezone
from apps.inventory.catalog_cache import bump_catalog_version
from django.utils.text import slugify
from PIL import Image
import io
from django.core.files.base import ContentFile
from simple_history.models import HistoricalRecords

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    image = models.ImageField(upload_to='categories/', null=True, blank=True)
    display_order = models.IntegerField(default=0, help_text='Orden de aparición en la tienda (menor = primero)')
    meli_category_id = models.CharField(max_length=20, null=True, blank=True, help_text='ID de categoría equivalente en Mercado Libre')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
        bump_catalog_version()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        bump_catalog_version()

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    
    # Pricing
    price_retail = models.DecimalField(max_digits=12, decimal_places=2)
    price_wholesale = models.DecimalField(max_digits=12, decimal_places=2, help_text='Precio para clientes Gremio/Distribuidor')
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Stock
    stock_current = models.IntegerField(default=0)
    stock_min = models.IntegerField(default=5)
    # Trazabilidad stock web → Google Sheet (el Apps Script sube los pendientes
    # antes de cada sync; ver GoogleSheetsStockPushView)
    stock_updated_at = models.DateTimeField(
        null=True, blank=True,
        help_text='Último cambio de stock hecho en la web',
    )
    stock_pushed_at = models.DateTimeField(
        null=True, blank=True,
        help_text='Última versión de stock confirmada como subida al Google Sheet',
    )
    
    # Flags
    is_active = models.BooleanField(default=True)
    is_ecommerce = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)
    
    # Integrations
    meli_item_id = models.CharField(max_length=50, null=True, blank=True)
    meli_sync = models.BooleanField(default=False)
    meli_category_id = models.CharField(max_length=20, null=True, blank=True)
    meli_condition = models.CharField(max_length=20, default='new', choices=[
        ('new', 'Nuevo'),
        ('used', 'Usado'),
        ('not_specified', 'No especificado')
    ])
    meli_listing_type = models.CharField(max_length=30, default='gold_special', choices=[
        ('gold_special', 'Premium'),
        ('gold_pro', 'Clásica'),
        ('silver', 'Plata'),
        ('bronze', 'Bronce')
    ])

    # Technical Specifications
    brand = models.CharField(max_length=100, null=True, blank=True)
    material = models.CharField(max_length=255, null=True, blank=True)
    weight = models.CharField(max_length=50, null=True, blank=True)
    dimensions = models.CharField(max_length=100, null=True, blank=True)
    warranty = models.CharField(max_length=255, null=True, blank=True)
    specifications = models.TextField(null=True, blank=True)
    
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    barcode = models.CharField(max_length=100, null=True, blank=True)
    
    # New: Discount
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    history = HistoricalRecords()

    class Meta:
        # Índices creados por 0010_add_catalog_performance_indexes: se declaran
        # acá para que el estado de Django coincida con la BD (sino makemigrations
        # quiere borrarlos cada vez).
        indexes = [
            models.Index(
                fields=['is_active', 'is_ecommerce', 'stock_current'],
                name='product_catalog_idx',
            ),
            models.Index(
                fields=['featured', 'is_active', 'is_ecommerce'],
                name='product_featured_idx',
            ),
            models.Index(
                fields=['category', 'is_active', 'is_ecommerce', 'stock_current'],
                name='product_category_catalog_idx',
            ),
            models.Index(
                fields=['meli_sync', 'is_active'],
                name='product_meli_sync_idx',
            ),
        ]

    def save(self, *args, **kwargs):
        if self.image:
            try:
                # Solo reprocesar cuando la imagen es nueva o cambió: evita
                # re-comprimir y re-grabar el archivo en cada guardado
                # (p.ej. sync diario de precios/stock que no toca la foto).
                reprocesar = True
                if self.pk:
                    try:
                        anterior = Product.objects.only('image').get(pk=self.pk)
                        reprocesar = not anterior.image or anterior.image.name != self.image.name
                    except Product.DoesNotExist:
                        pass
                if reprocesar:
                    img = Image.open(self.image)
                    if img.height > 1200 or img.width > 1200:
                        output_size = (1200, 1200)
                        img.thumbnail(output_size)

                        if img.mode in ("RGBA", "P"):
                            img = img.convert("RGB")

                        output = io.BytesIO()
                        img.save(output, format='WebP', quality=85)
                        output.seek(0)

                        name = self.image.name.split('.')[0] + '.webp'
                        self.image = ContentFile(output.read(), name=name)
            except Exception:
                pass

        # Stock cambiado en la web → marcar para subirlo al Google Sheet.
        # El sync sheet→web escribe con bulk_update (no pasa por save()) → no
        # marca nada, así que solo los cambios hechos desde la web quedan pendientes.
        if self.pk:
            en_bd = Product.objects.filter(pk=self.pk).values_list(
                'stock_current', flat=True
            ).first()
            if en_bd is not None and en_bd != self.stock_current:
                self.stock_updated_at = timezone.now()
                if (
                    kwargs.get('update_fields') is not None
                    and 'stock_updated_at' not in kwargs['update_fields']
                ):
                    kwargs['update_fields'] = list(kwargs['update_fields']) + [
                        'stock_updated_at'
                    ]

        super().save(*args, **kwargs)
        bump_catalog_version()

    def __str__(self):
        return f"{self.name} - SKU: {self.sku}"

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        bump_catalog_version()

class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='additional_images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/')
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order']

    def __str__(self):
        return f"Image for {self.product.name}"

class Kit(models.Model):
    """ Bundle/Combo of products """
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    items = models.ManyToManyField(Product, through='KitItem')
    is_active = models.BooleanField(default=True)

class KitItem(models.Model):
    kit = models.ForeignKey(Kit, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

class StockMovement(models.Model):
    TYPE_CHOICES = (
        ('IN', 'Entrada'),
        ('OUT', 'Salida'),
        ('ADJ', 'Ajuste'),
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    type = models.CharField(choices=TYPE_CHOICES, max_length=10)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
