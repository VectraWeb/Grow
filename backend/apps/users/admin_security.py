# Admin Security Module - Protecciones adicionales para el dashboard admin
from django.contrib.admin.apps import AdminConfig
from django.utils.translation import gettext_lazy as _
from django.contrib import admin as django_admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from functools import wraps
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods
from django.contrib import messages
import logging

logger = logging.getLogger(__name__)

class FerreAdminConfig(AdminConfig):
    """
    Configuración segura del admin de Django
    """
    verbose_name = _("Administration")
    
    def ready(self):
        super().ready()
        # Aquí podrías agregar lógica de inicialización segura


def admin_security_required(view_func):
    """
    Decorator para verificar seguridad adicional en el admin
    """
    @wraps(view_func)
    @login_required
    @permission_required('auth.change_user', raise_exception=True)
    @require_http_methods(["GET", "POST"])
    def wrapped(*args, **kwargs):
        request = args[0]
        
        # Verificar que el usuario es staff
        if not request.user.is_staff:
            logger.warning(f"Intento de acceso admin no autorizado: {request.user}")
            messages.error(request, "No tienes permisos para acceder al administrador")
            return redirect('login')
        
        # Log de acceso
        logger.info(f"Admin access by {request.user} from {request.META.get('REMOTE_ADDR')}")
        
        return view_func(*args, **kwargs)
    return wrapped


# Configuración de seguridad avanzada
ADMIN_SECURITY_SETTINGS = {
    'require_2fa': False,  # Cambiar a True para habilitar 2FA
    'log_admin_actions': True,
    'restrict_ip': False,
    'admin_session_timeout': 3600,  # 1 hora
    'max_login_attempts': 5,
    'lockout_duration': 1800,  # 30 minutos
}
