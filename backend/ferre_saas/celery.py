# Configuración de Celery para tareas asincrónicas y programadas
# Maneja colas de trabajo, programación de tareas periódicas y procesamiento de fondo
import os
from celery import Celery
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferre_saas.settings')

app = Celery('ferre_saas')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
