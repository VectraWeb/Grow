# Hashers de contraseña personalizados.
from django.contrib.auth.hashers import Argon2PasswordHasher


class FastArgon2PasswordHasher(Argon2PasswordHasher):
    """Argon2id con parámetros OWASP (m=19MB, t=2, p=1).

    Los defaults de Django (m=100MB, p=8 hilos) tardaban ~2.5s en la CPU
    limitada y compartida de Render Free. Con estos parámetros (recomendación
    OWASP 2024 para argon2id) el verify baja a <0.3s incluso ahí, sin bajar
    la seguridad real (19MB × 2 rondas es lo que hoy recomienda OWASP).
    """

    time_cost = 2
    memory_cost = 19456  # 19 MiB
    parallelism = 1

    def must_update(self, encoded):
        # Re-hashear también cuando el algoritmo sigue siendo argon2 pero los
        # parámetros embebidos (m=,t=,p=) no coinciden con los vigentes —
        # p.ej. al migrar de los defaults de Django a estos. Sin esto, un hash
        # argon2 viejo con parámetros lentos nunca se actualizaría.
        if super().must_update(encoded):
            return True
        try:
            # Formato: $argon2id$v=19$m=102400,t=2,p=8$salt$hash
            embebidos = encoded.split("$")[3]
            esperado = f"m={self.memory_cost},t={self.time_cost},p={self.parallelism}"
            return embebidos != esperado
        except (IndexError, AttributeError):
            return True
