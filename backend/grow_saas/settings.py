# Configuración principal de Django (Single-tenant)
# Define bases de datos, aplicaciones instaladas, middleware, autenticación y variables de entorno
import os
from pathlib import Path
from datetime import timedelta
import environ
import dj_database_url

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["*"]),
)

BASE_DIR = Path(__file__).resolve().parent.parent
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env("SECRET_KEY", default="django-insecure-key-for-dev")
DEBUG = env.bool("DEBUG", default=True)

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

# Mercado Pago
MP_ACCESS_TOKEN = env("MP_ACCESS_TOKEN", default="")
MP_WEBHOOK_URL = env("MP_WEBHOOK_URL", default="http://localhost:8000/api/integrations/mercadopago/webhook/")

# Mercado Libre
MELI_CLIENT_ID = env("MELI_CLIENT_ID", default="")
MELI_CLIENT_SECRET = env("MELI_CLIENT_SECRET", default="")
MELI_REDIRECT_URI = env("MELI_REDIRECT_URI", default="http://localhost:4200/admin/meli/")

# Frontend URL para redirects del OAuth callback
FRONTEND_URL = env("FRONTEND_URL", default="https://tierra-verde-grow.vercel.app")

# Mercado Pago
MP_APP_ID = env("MP_APP_ID", default="")
MP_CLIENT_SECRET = env("MP_CLIENT_SECRET", default="")
MP_REDIRECT_URI = env("MP_REDIRECT_URI", default="http://localhost:4200/admin/settings")

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sitemaps',       # Sitemap XML dinámico

    'apps.users',
    'apps.inventory',
    'apps.sales',
    'apps.integrations',
    'apps.ecommerce',

    'rest_framework',
    'corsheaders',
    'axes',
    'simple_history',
    'django_otp',
    'cloudinary_storage',
    'cloudinary',
]


MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'axes.middleware.AxesMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware',
    'django_otp.middleware.OTPMiddleware',
]

ROOT_URLCONF = 'grow_saas.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'grow_saas.wsgi.application'

# Detectar si estamos en Neon (producción) para activar connection pooling
_DATABASE_URL = os.environ.get('DATABASE_URL', '')
_IS_NEON = 'neon.tech' in _DATABASE_URL

DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        # OPTIMIZACIÓN: En Neon serverless, conn_max_age=0 abre/cierra una conexión
        # por cada request (+200-400ms). Con pooling reutilizamos conexiones 10min.
        # ⚠️  Usar la URL del Pooler de Neon en Dashboard → Connection Details → "Pooled"
        conn_max_age=600 if _IS_NEON else 0,
        conn_health_checks=True,    # Django 4.2+ — verifica que la conexión siga viva
        ssl_require=not DEBUG,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTH_USER_MODEL = 'users.User'

LANGUAGE_CODE = 'es-ar'
TIME_ZONE = 'America/Argentina/Buenos_Aires'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

CLOUDINARY_URL = env("CLOUDINARY_URL", default="")
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
if CLOUDINARY_URL and not DEBUG:
    STORAGES["default"] = {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    }
else:
    STORAGES["default"] = {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    }

LOGIN_URL = '/admin-secure-grow/login/'
LOGIN_REDIRECT_URL = '/admin-secure-grow/'
TWO_FACTOR_PATCH_ADMIN = False

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Throttling para proteger endpoints públicos (catálogo, checkout)
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/min',   # Visitantes anónimos (catálogo público)
        'user': '300/min',   # Usuarios autenticados (admin/POS)
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),   # Reducido de 1h a 30min
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'VERIFY_SIGNATURE': True,
    'UPDATE_LAST_LOGIN': True,          # Registrar timestamp del último login
    'AUTH_HEADER_TYPES': ('Bearer',),
    'JTI_CLAIM': 'jti',                 # Para blacklisting efectivo
}

SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=not DEBUG)
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=not DEBUG)
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=not DEBUG)
MOCK_EXTERNAL_SERVICES = env.bool("MOCK_EXTERNAL_SERVICES", default=False)
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_SECURITY_POLICY = {
    "default-src": ("'self'", "https://api.mercadopago.com", "https://maps.googleapis.com", "https://*.google.com"),
    "script-src": ("'self'", "'unsafe-inline'", "https://sdk.mercadopago.com", "https://maps.googleapis.com"),
    "style-src": ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com"),
    "font-src": ("'self'", "https://fonts.gstatic.com"),
    "img-src": ("'self'", "data:", "https://*.mercadolibre.com", "https://*.mlstatic.com", "https://maps.gstatic.com", "https://maps.googleapis.com", "https://res.cloudinary.com"),
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'error.log'),
            'formatter': 'verbose',
        },
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'apps': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

ADMIN_URL = 'admin-secure-grow/'
ADMIN_SITE_HEADER = "VectraWeb Admin Panel"

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
]

AXES_FAILURE_LIMIT = 10
AXES_COOLOFF_TIME = 0.5
AXES_LOCKOUT_PARAMETERS = ["username", "ip_address"]
AXES_RESET_ON_SUCCESS = True

SESSION_COOKIE_AGE = 3600
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

CELERY_BROKER_URL = env("REDIS_URL", default="redis://127.0.0.1:6379/0")
CELERY_RESULT_BACKEND = env("REDIS_URL", default="redis://127.0.0.1:6379/0")
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
# Limitar concurrencia para no saturar Neon en picos
CELERY_WORKER_CONCURRENCY = env.int("CELERY_CONCURRENCY", default=2)
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=False)

# Webhook de sync automático de Sheets (Apps Script / cron): token compartido.
# Sin esto, el endpoint /api/integrations/google-sheets/webhook/ responde 503.
SHEETS_WEBHOOK_TOKEN = env("SHEETS_WEBHOOK_TOKEN", default="")

# Tareas periódicas (Celery Beat) — guard para entornos sin celery instalado
try:
    from celery.schedules import crontab
    CELERY_BEAT_SCHEDULE = {
        'sync-meli-stock-hourly': {
            'task': 'apps.integrations.tasks.sync_meli_active_products',
            'schedule': crontab(minute=5),  # X:05 de cada hora
        },
    }
except ImportError:
    pass  # Celery no instalado (dev sin redis)


# Caché — usa Redis si está disponible (comparte instancia con Celery), si no locmem
_REDIS_URL = env("REDIS_URL", default="")
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": _REDIS_URL,
        "TIMEOUT": 300,
        "KEY_PREFIX": "tvg",
    } if _REDIS_URL else {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "tierra-verde-grow",
        "TIMEOUT": 300,
    }
}

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False

    CORS_ALLOWED_ORIGINS = env.list(
        "CORS_ALLOWED_ORIGINS",
        default=[
            "http://localhost:4200",
        ]
    )

    CSRF_TRUSTED_ORIGINS = env.list(
        "CSRF_TRUSTED_ORIGINS",
        default=[
            "http://localhost:4200",
        ]
    )

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = (
    "accept",
    "authorization",
    "content-type",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "cache-control",
    "pragma",
    "expires",
)

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = env("EMAIL_HOST", default="")
    EMAIL_PORT = env.int("EMAIL_PORT", default=587)
    EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
    EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
    EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
    DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default=EMAIL_HOST_USER)
