# Modelos del e-commerce: carrito, promociones, banners y productos del catálogo
# Gestiona la experiencia de compra online, sesiones y descuentos
from django.db import models
from apps.inventory.models import Product, Category

class Banner(models.Model):
    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to='banners/')
    link = models.URLField(blank=True, help_text="Where the banner links to (optional)")
    position = models.IntegerField(default=0, help_text="Order in slider")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - Pos: {self.position}"

class Promotion(models.Model):
    name = models.CharField(max_length=100)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    products = models.ManyToManyField(Product, related_name='promotions')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Cart(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)


class ProductRating(models.Model):
    """Calificaciones de clientes para productos"""
    product = models.ForeignKey(Product, related_name='ratings', on_delete=models.CASCADE)
    session_id = models.CharField(max_length=100)  # Identificador de sesión anónima
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 estrellas
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'session_id')  # Un cliente (por sesión) una calificación por producto

    def __str__(self):
        return f"{self.product.name} - {self.rating}⭐"
