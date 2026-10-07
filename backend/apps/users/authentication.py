# Autenticación JWT sin consulta a la DB en cada request.
from django.core.cache import cache
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings


class CachedJWTAuthentication(JWTAuthentication):
    """JWTAuthentication con el usuario cacheado 60 segundos.

    El get_user de SimpleJWT hace una consulta a la DB (Neon) por CADA
    request autenticado (~0.3-0.4s ahí), lo que marcaba el piso de tiempo
    de todos los endpoints del panel (~0.6s incluso con caché hit). Aquí el
    usuario se cachea por PK; la latencia máxima de detección de un usuario
    desactivado es de 60s (aceptable para el panel de un solo admin).
    """

    USER_CACHE_TTL = 60  # segundos

    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            # Sin claim: comportamiento original (lanza InvalidToken)
            return super().get_user(validated_token)

        key = f"auth:user:{user_id}"
        user = cache.get(key)
        if user is None:
            # Valida existencia y is_active; si falla, lanza como SimpleJWT
            user = super().get_user(validated_token)
            cache.set(key, user, self.USER_CACHE_TTL)
        return user
