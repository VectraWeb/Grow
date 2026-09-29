# Interfaz WSGI de Django para servidores de producción (Gunicorn, Apache, etc.)
# Punto de entrada para la aplicación web
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferre_saas.settings')
application = get_wsgi_application()
