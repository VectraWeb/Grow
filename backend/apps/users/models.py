# Modelo personalizado de usuario con autenticación por email y roles de usuario
# Soporta ADMIN, EMPLOYEE y CUSTOMER con información empresarial adicional
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    # Overriding fields
    username = None
    email = models.EmailField(unique=True)

    # Roles
    ADMIN = 'ADMIN'
    EMPLOYEE = 'EMPLOYEE'
    CUSTOMER = 'CUSTOMER'
    
    ROLE_CHOICES = (
        (ADMIN, 'Administrador'),
        (EMPLOYEE, 'Empleado'),
        (CUSTOMER, 'Cliente'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CUSTOMER)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"

class StoreConfig(models.Model):
    name = models.CharField(max_length=100, default="Mi Ferretería")
    store_postal_code = models.CharField(max_length=20, null=True, blank=True)
    store_address = models.CharField(max_length=255, null=True, blank=True)
    
    bank_titular = models.CharField(max_length=100, null=True, blank=True)
    bank_cuit = models.CharField(max_length=20, null=True, blank=True)
    bank_cvu = models.CharField(max_length=50, null=True, blank=True)
    bank_alias = models.CharField(max_length=50, null=True, blank=True)
    whatsapp_number = models.CharField(max_length=20, null=True, blank=True)
    instagram_url = models.CharField(max_length=255, null=True, blank=True)
    facebook_url = models.CharField(max_length=255, null=True, blank=True)
    
    mp_access_token = models.CharField(max_length=255, null=True, blank=True)
    mp_public_key = models.CharField(max_length=255, null=True, blank=True)
    mp_refresh_token = models.CharField(max_length=255, null=True, blank=True)
    
    def __str__(self):
        return self.name
