# Backends de autenticación personalizados.
from django.contrib.auth import hashers as auth_hashers
from django.contrib.auth.backends import ModelBackend


class RehashingModelBackend(ModelBackend):
    """ModelBackend + re-hash de la contraseña en el primer login exitoso.

    Usa check_password(..., setter=...) de Django: re-hashea cuando cambió el
    algoritmo (p.ej. PBKDF2 -> Argon2) O cuando cambiaron los parámetros del
    mismo algoritmo (p.ej. Argon2 100MB/8hilos -> Argon2 19MB/1hil), sin
    cambiar la contraseña del usuario. Así los logins pasan de ~2.5s
    (PBKDF2 1M iteraciones o Argon2 pesado en la CPU de Render) a <0.5s.

    Se usa junto a axes.backends.AxesStandaloneBackend (que solo monitorea
    y devuelve None si el intento está permitido).
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        user = super().authenticate(request, username=username, password=password, **kwargs)
        if user is not None and password:
            try:
                stored = user.password or ''
                if stored:
                    def rehash(raw_password):
                        user.set_password(raw_password)
                        user.save(update_fields=['password'])
                    auth_hashers.check_password(password, stored, setter=rehash)
            except Exception:
                # Nunca romper el login por fallar el re-hash
                pass
        return user
