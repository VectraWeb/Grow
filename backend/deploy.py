import os
import django

# 1. Lee DATABASE_URL de las variables de entorno
db_url = os.environ.get('DATABASE_URL')

if db_url:
    from urllib.parse import urlparse
    info = urlparse(db_url)

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferre_saas.settings')
    django.setup()

    from django.conf import settings
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': info.path.lstrip('/'),
        'USER': info.username or '',
        'PASSWORD': info.password or '',
        'HOST': info.hostname or 'localhost',
        'PORT': info.port or '5432',
    }
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferre_saas.settings')
    django.setup()

from django.core.management import execute_from_command_line
from django.contrib.auth import get_user_model

def run_deploy():
    print("Conectando a la base de datos e iniciando migraciones...")
    execute_from_command_line(['manage.py', 'migrate', '--noinput'])
    print("Migraciones finalizadas con exito.")

    # Crear superusuario desde variables de entorno (no hardcodeado)
    User = get_user_model()
    admin_email = os.environ.get('DJANGO_ADMIN_EMAIL', '')
    admin_password = os.environ.get('DJANGO_ADMIN_PASSWORD', '')

    if admin_email and admin_password:
        if not User.objects.filter(email=admin_email).exists():
            print(f"Creando superusuario: {admin_email}...")
            User.objects.create_superuser(email=admin_email, password=admin_password)
            print("Superusuario creado con exito.")
        else:
            print("El superusuario ya existe, salteando paso.")
    else:
        print("DJANGO_ADMIN_EMAIL o DJANGO_ADMIN_PASSWORD no configurados, saltando creacion de superusuario.")

    print("Cargando imagenes de productos y banners...")
    execute_from_command_line(['manage.py', 'seed_images'])

if __name__ == '__main__':
    run_deploy()
