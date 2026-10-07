# Backends de autenticación personalizados.
from django.conf import settings
from django.contrib.auth import hashers as auth_hashers
from django.contrib.auth.backends import ModelBackend


class RehashingModelBackend(ModelBackend):
    """ModelBackend + re-hash de la contraseña en el primer login exitoso.

    Si el algoritmo o los parámetros del hasher cambian (p.ej. al migrar de
    PBKDF2 a Argon2), la contraseña se vuelve a hashear con el hasher vigente
    sin cambiar la contraseña del usuario. Así los logins pasan de ~2.5s
    (PBKDF2 1M iteraciones en la CPU de Render) a <0.5s (Argon2) a partir
    del segundo intento.

    Se usa junto a axes.backends.AxesStandaloneBackend (que solo monitorea
    y devuelve None si el intento está permitido).
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        user = super().authenticate(request, username=username, password=password, **kwargs)
        if user is not None and password:
            try:
                stored = user.password or ''
                if stored:
                    actual = auth_hashers.identify_hasher(stored)
                    preferido = auth_hashers.get_hasher('default')
                    if actual.algorithm != preferido.algorithm:
                        user.set_password(password)
                        user.save(update_fields=['password'])
            except Exception:
                # Nunca romper el login por fallar el re-hash
                pass
        return user
