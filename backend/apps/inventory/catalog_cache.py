# Cache del catálogo público (productos, categorías, banners, info de tienda).
#
# Estrategia: TTL corto (5 min) + versionado. Cada escritura del catálogo
# (API, admin de Django, sync de Sheets, scripts) incrementa la versión y las
# claves viejas quedan huérfanas hasta expirar. Nunca se borra nada.
#
# Todos los helpers son defensivos: si la caché falla (p.ej. Redis caído),
# se sigue sirviendo desde la base sin romper el request.
import hashlib
import logging

from django.core.cache import cache

logger = logging.getLogger(__name__)

CATALOG_TTL = 300  # segundos: equilibrio entre velocidad y frescura de precios/stock
CATALOG_VERSION_KEY = "catalog:version"


def _safe_get(key):
    try:
        return cache.get(key)
    except Exception as exc:
        logger.warning("Cache GET falló (%s): %s", key, exc)
        return None


def _safe_set(key, value, timeout):
    try:
        cache.set(key, value, timeout)
    except Exception as exc:
        logger.warning("Cache SET falló (%s): %s", key, exc)


def get_catalog_version() -> int:
    version = _safe_get(CATALOG_VERSION_KEY)
    if version is None:
        _safe_set(CATALOG_VERSION_KEY, 1, None)
        return 1
    try:
        return int(version)
    except (TypeError, ValueError):
        return 1


def bump_catalog_version() -> int:
    """Invalida el catálogo cacheado. Nunca levanta excepciones."""
    try:
        try:
            return cache.incr(CATALOG_VERSION_KEY)
        except ValueError:
            # La clave no existía (p.ej. caché recién reiniciada)
            cache.set(CATALOG_VERSION_KEY, 1, timeout=None)
            return 1
    except Exception as exc:
        logger.warning("Cache INCR falló (%s): %s", CATALOG_VERSION_KEY, exc)
        return 0


def get_cached_public_list(request, prefix):
    """Devuelve (clave, datos). `datos` es None cuando no hay hit de caché."""
    parts = []
    for name in sorted(request.query_params.keys()):
        values = sorted(request.query_params.getlist(name))
        parts.append(f"{name}={'|'.join(values)}")
    digest = hashlib.md5("&".join(parts).encode("utf-8")).hexdigest()
    key = f"{prefix}:v{get_catalog_version()}:{digest}"
    return key, _safe_get(key)


def set_cached_public_list(key, data):
    _safe_set(key, data, CATALOG_TTL)
