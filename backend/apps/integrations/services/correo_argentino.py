import requests
import json
from django.conf import settings
from datetime import datetime, timedelta

class CorreoArgentinoService:
    """
    Integración con la API de MiCorreo (Correo Argentino).
    Docs: https://api.correoargentino.com.ar/micorreo/v1
    """
    
    BASE_URL_PROD = "https://api.correoargentino.com.ar/micorreo/v1"
    BASE_URL_QA = "https://apitest.correoargentino.com.ar/micorreo/v1"

    def __init__(self, username=None, password=None, customer_id=None, is_production=False):
        self.base_url = self.BASE_URL_PROD if is_production else self.BASE_URL_QA
        self.username = username
        self.password = password
        self.customer_id = customer_id
        self.token = None

    def get_token(self):
        """Autenticación para obtener el token JWT"""
        if not self.username or not self.password:
            # Fallback a mock token
            mock_allowed = getattr(settings, 'MOCK_EXTERNAL_SERVICES', True)
            if mock_allowed:
                self.token = "mock_token"
                return self.token
            else:
                raise Exception("Missing Correo Argentino credentials and MOCK_EXTERNAL_SERVICES is False")

        response = requests.post(
            f"{self.base_url}/token",
            auth=(self.username, self.password)
        )
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('token')
            return self.token
        else:
            raise Exception(f"Failed to authenticate with Correo Argentino API: {response.text}")

    def get_rates(self, origin_cp, destination_cp, weight_g, dimensions=None, delivery_type="D"):
        """
        Obtiene cotizaciones de envío.
        delivery_type: "D" (Domicilio) o "S" (Sucursal)
        dimensions: dict with keys: height, width, length (in cm)
        """
        if not self.token:
            self.get_token()

        # Usar dimensiones por defecto de paquete estándar si no están disponibles
        if not dimensions:
            dimensions = {
                "height": 10,
                "width": 20,
                "length": 30
            }

        payload = {
            "customerId": self.customer_id or "0000000000",
            "postalCodeOrigin": str(origin_cp),
            "postalCodeDestination": str(destination_cp),
            "deliveredType": delivery_type,
            "dimensions": {
                "weight": max(1, int(weight_g)),
                "height": int(dimensions.get("height", 10)),
                "width": int(dimensions.get("width", 20)),
                "length": int(dimensions.get("length", 30))
            }
        }

        # Mock Mode si no hay credenciales reales configuradas para no romper el front
        mock_allowed = getattr(settings, 'MOCK_EXTERNAL_SERVICES', True)
        if mock_allowed and (not self.username or self.token == "mock_token"):
            # Simulamos el precio en base a un simple calculo de distancia
            # (Misma provincia vs Distinta provincia: una simple aproximación asumiendo el 1er caracter del CP)
            base_price = 4500.00
            if str(origin_cp)[0] != str(destination_cp)[0]:
                base_price += 2500.00
            
            # Recargo por peso
            if weight_g > 1000:
                base_price += (weight_g / 1000) * 1500.00
                
            return {
                "validTo": (datetime.now() + timedelta(days=7)).isoformat(),
                "rates": [
                    {
                        "deliveredType": "D",
                        "productType": "CP",
                        "productName": "Paq.ar Clásico a Domicilio",
                        "price": round(base_price, 2)
                    },
                    {
                        "deliveredType": "S",
                        "productType": "CP",
                        "productName": "Paq.ar Clásico a Sucursal",
                        "price": round(base_price * 0.8, 2) # Sucursal suele ser más barato
                    }
                ]
            }

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        response = requests.post(f"{self.base_url}/rates", json=payload, headers=headers)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 402:
            raise Exception("Parámetros válidos pero la solicitud falló en Correo Argentino.")
        else:
            raise Exception(f"Error fetching rates: {response.text}")
