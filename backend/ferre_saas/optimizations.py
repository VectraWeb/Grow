# Backend Performance Optimizations
# Middleware, Caching, y Query Optimization

from django.core.cache import cache
from django.views.decorators.cache import cache_page, cache_control
from django.views.decorators.http import condition
from django.utils.decorators import method_decorator
from django.db.models import Prefetch, F
from rest_framework.response import Response
from rest_framework.views import APIView
from functools import lru_cache
import hashlib
import gzip
import io

class CacheOptimizationMixin:
    """
    Mixin para optimizar cachés en viewsets
    """
    cache_timeout = 300  # 5 minutos
    cache_key_prefix = 'api'

    def get_cache_key(self, request, *args, **kwargs):
        """
        Generar clave de caché única para la request
        """
        path = request.path
        query = request.GET.urlencode()
        key = f"{self.cache_key_prefix}:{path}:{query}"
        return hashlib.md5(key.encode()).hexdigest()

    def get_cached_response(self, key, fetcher):
        """
        Obtener respuesta del caché o generarla
        """
        cached = cache.get(key)
        if cached:
            return cached

        response_data = fetcher()
        cache.set(key, response_data, self.cache_timeout)
        return response_data


class OptimizedProductViewMixin(CacheOptimizationMixin):
    """
    Optimizaciones específicas para vistas de productos
    """

    def get_queryset(self):
        """
        Optimizar queries con select_related y prefetch_related
        """
        queryset = super().get_queryset()
        
        # Evitar N+1 queries
        queryset = queryset.select_related(
            'category',
            'supplier',
            'warranty_policy'
        ).prefetch_related(
            'images',
            'reviews',
            'inventory_set'
        )
        
        # Anotaciones para mejorar rendimiento
        from django.db.models import Count, Avg
        queryset = queryset.annotate(
            review_count=Count('reviews'),
            average_rating=Avg('reviews__rating'),
            stock_total=Sum('inventory__quantity')
        )
        
        return queryset


class GzipMiddleware:
    """
    Middleware para comprimir respuestas HTTP
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Comprimir si el cliente lo soporta
        if 'gzip' in request.META.get('HTTP_ACCEPT_ENCODING', ''):
            if len(response.content) > 1024:  # Solo comprimir si > 1KB
                gzip_buffer = io.BytesIO()
                gzip_file = gzip.GzipFile(
                    mode='wb',
                    fileobj=gzip_buffer,
                    compresslevel=6
                )
                gzip_file.write(response.content)
                gzip_file.close()
                
                response.content = gzip_buffer.getvalue()
                response['Content-Encoding'] = 'gzip'
                response['Content-Length'] = len(response.content)
        
        return response


class DatabaseConnectionPooling:
    """
    Configuración de connection pooling para PostgreSQL
    Agregar a settings.py en DATABASES
    """
    POOL_CONFIG = {
        'CONN_MAX_AGE': 600,  # Reutilizar conexiones por 10 minutos
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }


# Cache Keys Manager
@lru_cache(maxsize=32)
def get_cache_version_key(prefix: str) -> str:
    """
    Obtener versión de caché para invalidación global
    """
    return cache.get(f"{prefix}_version", "v1")


class CacheInvalidationService:
    """
    Servicio para invalidar cachés de forma controlada
    """
    
    @staticmethod
    def invalidate_product_cache(product_id: int):
        """Invalidar caché de un producto específico"""
        cache.delete(f"api:product:{product_id}")
        cache.delete("api:products:list")

    @staticmethod
    def invalidate_category_cache(category_id: int):
        """Invalidar caché de categoría"""
        cache.delete(f"api:category:{category_id}")
        cache.delete("api:categories:list")

    @staticmethod
    def invalidate_all_caches():
        """Limpiar todos los cachés"""
        cache.clear()
