from django.apps import AppConfig
from django.db.models.signals import post_migrate

def crear_superusuario_automatico(sender, **kwargs):
    import os
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    email_admin = os.environ.get("DJANGO_ADMIN_EMAIL", "admin@ferre.com")
    password_admin = os.environ.get("DJANGO_ADMIN_PASSWORD", "admin123")
    
    if not User.objects.filter(email=email_admin).exists():
        print("Creando superusuario personalizado por código...")
        User.objects.create_superuser(
            email=email_admin,
            password=password_admin
        )
        print("¡Superusuario personalizado creado con éxito!")

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'  # <--- ESTO CORRIGE EL ERROR (Debe decir apps.users)

    def ready(self):
        post_migrate.connect(crear_superusuario_automatico, sender=self)
