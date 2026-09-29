# Rutas publicas accesibles sin autenticacion (login, registro, home)
# URLs para funcionalidad de e-commerce accesible al publico general
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', include('admin_honeypot.urls', namespace='admin_honeypot')),
    path('admin-secure-ferre/', admin.site.urls),
]
