# Modelos de ventas: clientes, pedidos, facturas y presupuestos
# Registra transacciones, estados de entrega y relaciones con clientes mayoristas
from django.db import models
from django.conf import settings
from apps.inventory.models import Product
from apps.users.models import User
from simple_history.models import HistoricalRecords

class Customer(models.Model):
    TYPE_CHOICES = (
        ('RETAIL', 'Consumidor Final'),
        ('WHOLESALE', 'Gremio / Distribuidor'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, null=True, blank=True)
    cuit = models.CharField(max_length=11, null=True, blank=True)
    cbu = models.CharField(max_length=22, null=True, blank=True)
    customer_type = models.CharField(choices=TYPE_CHOICES, max_length=20, default='RETAIL')
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    def __str__(self):
        return f"{self.name} ({self.customer_type})"

class Sale(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ('PENDING', 'Pendiente'),
        ('PAID', 'Pagado'),
        ('REJECTED', 'Rechazado'),
    )
    SHIPPING_STATUS_CHOICES = (
        ('PENDING', 'No enviado'),
        ('SHIPPED', 'Enviado'),
    )
    METHOD_CHOICES = (
        ('EFECTIVO', 'Efectivo'),
        ('TARJETA', 'Tarjeta'),
        ('TRANSFERENCIA', 'Transferencia'),
        ('MERCADO_PAGO', 'Mercado Pago'),
    )
    customer = models.ForeignKey(Customer, related_name='sales', on_delete=models.SET_NULL, null=True)
    seller = models.ForeignKey(User, related_name='sales_made', on_delete=models.SET_NULL, null=True)
    
    total = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(choices=METHOD_CHOICES, max_length=20, default='EFECTIVO')
    payment_status = models.CharField(choices=PAYMENT_STATUS_CHOICES, max_length=20, default='PENDING')
    shipping_status = models.CharField(choices=SHIPPING_STATUS_CHOICES, max_length=20, default='PENDING')
    
    # Shipment
    shipping_address = models.TextField(null=True, blank=True)
    tracking_number = models.CharField(max_length=100, null=True, blank=True)
    
    # Mercado Pago Traceability
    mp_preference_id = models.CharField(max_length=255, null=True, blank=True)
    mp_payment_id = models.CharField(max_length=255, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    history = HistoricalRecords()

    def __str__(self):
        return f"Sale #{self.id} - {self.customer.name if self.customer else 'Public'}"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=1)
    price_at_sale = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.price_at_sale
        super().save(*args, **kwargs)

class Ticket(models.Model):
    client = models.ForeignKey(Customer, on_delete=models.CASCADE)
    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)

class Budget(models.Model):
    customer = models.ForeignKey(Customer, related_name='budgets', on_delete=models.SET_NULL, null=True)
    seller = models.ForeignKey(User, related_name='budgets_made', on_delete=models.SET_NULL, null=True)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    valid_until = models.DateField()
    status = models.CharField(max_length=20, choices=(('PENDING','Pendiente'),('ACCEPTED','Aceptado'),('EXPIRED','Expirado')), default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Presupuesto #{self.id} - {self.customer.name if self.customer else 'Public'}"

class BudgetItem(models.Model):
    budget = models.ForeignKey(Budget, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=1)
    price_at_budget = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.price_at_budget
        super().save(*args, **kwargs)
