import hmac
import os
import time
from datetime import datetime

from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.db.models import Q, F
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.integrations.models import IntegrationConfig
from apps.inventory.models import Product
from apps.integrations.services.google_sheets_service import (
    GoogleSheetsSyncService,
    GoogleSheetsAccessError
)


class GoogleSheetsConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        config = IntegrationConfig.objects.filter(integration_type='GOOGLE_SHEETS').first()
        if not config:
            return Response({
                'is_configured': False,
                'sheet_url': 'https://docs.google.com/spreadsheets/d/17yIhDzBuelorQm9XrK4SMZ-uxwNzHnEX/edit?gid=699067785#gid=699067785',
                'last_sync': None,
                'last_summary': None
            })

        metadata = config.metadata or {}
        return Response({
            'is_configured': bool(metadata.get('sheet_url')),
            'sheet_url': metadata.get('sheet_url', 'https://docs.google.com/spreadsheets/d/17yIhDzBuelorQm9XrK4SMZ-uxwNzHnEX/edit?gid=699067785#gid=699067785'),
            'last_sync': config.last_sync,
            'last_summary': metadata.get('last_sync_summary')
        })

    def post(self, request):
        sheet_url = request.data.get('sheet_url', '').strip()
        if not sheet_url:
            return Response({'error': 'La URL de Google Sheets es obligatoria.'}, status=status.HTTP_400_BAD_REQUEST)

        config, _ = IntegrationConfig.objects.get_or_create(integration_type='GOOGLE_SHEETS')
        meta = config.metadata or {}
        meta['sheet_url'] = sheet_url
        config.metadata = meta
        config.save()

        return Response({'message': 'URL guardada exitosamente.', 'sheet_url': sheet_url})


class GoogleSheetsPreviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        url = request.data.get('url', '').strip()
        if not url:
            # Check if saved in config
            cfg = IntegrationConfig.objects.filter(integration_type='GOOGLE_SHEETS').first()
            if cfg and cfg.metadata and cfg.metadata.get('sheet_url'):
                url = cfg.metadata['sheet_url']

        if not url:
            return Response({'error': 'Debes ingresar la URL del Google Sheet.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            preview_data = GoogleSheetsSyncService.preview('url', url)
            return Response(preview_data)
        except GoogleSheetsAccessError as e:
            return Response({
                'error': str(e),
                'error_type': 'RESTRICTED_ACCESS'
            }, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'error': f"Error al procesar la hoja: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class GoogleSheetsSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        url = request.data.get('url', '').strip()
        update_store_info = request.data.get('update_store_info', True)
        run_async = request.data.get('async', True)  # Por defecto asíncrono

        if not url:
            cfg = IntegrationConfig.objects.filter(integration_type='GOOGLE_SHEETS').first()
            if cfg and cfg.metadata and cfg.metadata.get('sheet_url'):
                url = cfg.metadata['sheet_url']

        if not url:
            return Response({'error': 'Debes ingresar la URL del Google Sheet.'}, status=status.HTTP_400_BAD_REQUEST)

        # OPTIMIZACIÓN: Modo asíncrono — no bloquea el hilo web principal.
        # La tarea corre en el Celery Worker y actualiza IntegrationConfig al terminar.
        if run_async:
            try:
                from apps.integrations.tasks import sync_google_sheets_async
                task = sync_google_sheets_async.delay(url, update_store_info=update_store_info)
                return Response({
                    'message': 'Sincronización iniciada en segundo plano.',
                    'task_id': task.id,
                    'status': 'PENDING',
                }, status=status.HTTP_202_ACCEPTED)
            except Exception:
                # Si Celery no está disponible, fallback al modo síncrono
                pass

        # Fallback síncrono (si Celery no disponible o async=false)
        try:
            result = GoogleSheetsSyncService.sync('url', url, update_store_info=update_store_info)
            return Response(result)
        except GoogleSheetsAccessError as e:
            return Response({
                'error': str(e),
                'error_type': 'RESTRICTED_ACCESS'
            }, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'error': f"Error al sincronizar: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class GoogleSheetsWebhookView(APIView):
    """Webhook para sincronización AUTOMÁTICA del catálogo.

    Pensado para un trigger por tiempo de Google Apps Script o cron-job.org:
    cada N minutos hace POST aquí y el backend sincroniza solo, sin apretar
    botones. Se autentica con token compartido (header X-Webhook-Token),
    no con JWT de usuario.
    """
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        expected = (getattr(settings, 'SHEETS_WEBHOOK_TOKEN', '') or '').strip()
        if not expected:
            return Response(
                {'error': 'Webhook no configurado: falta SHEETS_WEBHOOK_TOKEN en el servidor.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        given = request.headers.get('X-Webhook-Token', '')
        if not given or not hmac.compare_digest(given, expected):
            return Response({'error': 'Token inválido.'}, status=status.HTTP_403_FORBIDDEN)

        # Anti-solapamiento: mínimo 2 minutos entre corridas automáticas
        try:
            last_run = cache.get('sheets:webhook:last')
        except Exception:
            last_run = None
        now = time.time()
        if last_run and (now - float(last_run)) < 120:
            return Response({
                'status': 'skipped',
                'message': 'Ya hubo una sincronización hace menos de 2 minutos.',
            })
        try:
            cache.set('sheets:webhook:last', now, 300)
        except Exception:
            pass

        data = request.data if isinstance(request.data, dict) else {}
        url = (data.get('url') or '').strip()
        if not url:
            cfg = IntegrationConfig.objects.filter(integration_type='GOOGLE_SHEETS').first()
            if cfg and cfg.metadata and cfg.metadata.get('sheet_url'):
                url = cfg.metadata['sheet_url']
        if not url:
            return Response(
                {'error': 'No hay URL de hoja configurada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        update_store_info = data.get('update_store_info', True)
        if isinstance(update_store_info, str):
            update_store_info = update_store_info.lower() in ('true', '1')

        try:
            result = GoogleSheetsSyncService.sync('url', url, update_store_info=update_store_info)
            return Response(result)
        except GoogleSheetsAccessError as e:
            return Response({
                'error': str(e),
                'error_type': 'RESTRICTED_ACCESS'
            }, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'error': f"Error al sincronizar: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class GoogleSheetsUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('file')
        action = request.data.get('action', 'preview') # 'preview' or 'sync'
        update_store_info = request.data.get('update_store_info', 'true').lower() in ('true', '1')

        if not file_obj:
            return Response({'error': 'No se envió ningún archivo.'}, status=status.HTTP_400_BAD_REQUEST)

        filename = file_obj.name.lower()
        file_bytes = file_obj.read()

        try:
            if filename.endswith('.xlsx') or filename.endswith('.xls'):
                source_type = 'excel_bytes'
                source_data = file_bytes
            elif filename.endswith('.csv'):
                source_type = 'csv_text'
                source_data = file_bytes.decode('utf-8', errors='replace')
            else:
                return Response({'error': 'Formato no soportado. Debe ser un archivo .xlsx o .csv'}, status=status.HTTP_400_BAD_REQUEST)

            if action == 'sync':
                result = GoogleSheetsSyncService.sync(source_type, source_data, update_store_info=update_store_info)
                return Response(result)
            else:
                preview_data = GoogleSheetsSyncService.preview(source_type, source_data)
                return Response(preview_data)

        except Exception as e:
            return Response({'error': f"Error al procesar el archivo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class GoogleSheetsStockPushView(APIView):
    """Stock que cambió en la web y todavía no está reflejado en el Google Sheet.

    Lo consume el Apps Script en cada tick, ANTES del sync normal:
      GET  → {"pendientes": [{"sku", "name", "stock", "stock_updated_at"}]}
      POST → {"confirmaciones": [{"sku", "stock_updated_at"}]} → {"confirmados": n}

    El confirmar marca la versión que llegó al Sheet: si mientras tanto entró
    otra venta, esa fila sigue quedando pendiente para el próximo tick.
    Autenticación: header X-Webhook-Token (mismo token que el webhook de sync).
    """
    authentication_classes = []
    permission_classes = []

    def _chequear_token(self, request):
        esperado = (getattr(settings, 'SHEETS_WEBHOOK_TOKEN', '') or '').strip()
        if not esperado:
            return Response(
                {'error': 'Falta SHEETS_WEBHOOK_TOKEN en el servidor.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        dado = request.headers.get('X-Webhook-Token', '')
        if not dado or not hmac.compare_digest(dado, esperado):
            return Response({'error': 'Token inválido.'}, status=status.HTTP_403_FORBIDDEN)
        return None

    @staticmethod
    def _pendientes():
        return (
            Product.objects.filter(stock_updated_at__isnull=False)
            .filter(
                Q(stock_pushed_at__isnull=True)
                | Q(stock_pushed_at__lt=F('stock_updated_at'))
            )
            .order_by('sku')
        )

    def get(self, request):
        error = self._chequear_token(request)
        if error:
            return error
        datos = [
            {
                'sku': p.sku,
                'name': p.name,
                'stock': p.stock_current,
                'stock_updated_at': p.stock_updated_at.isoformat(),
            }
            for p in self._pendientes()
        ]
        return Response({'pendientes': datos})

    def post(self, request):
        error = self._chequear_token(request)
        if error:
            return error
        data = request.data if isinstance(request.data, dict) else {}
        confirmaciones = data.get('confirmaciones') or []
        por_sku = {}
        for c in confirmaciones:
            if isinstance(c, dict) and c.get('sku'):
                por_sku[str(c['sku'])] = c.get('stock_updated_at')
        if not por_sku:
            return Response({'confirmados': 0})

        confirmados = 0
        with transaction.atomic():
            for prod in Product.objects.filter(sku__in=list(por_sku)):
                try:
                    dt = datetime.fromisoformat(
                        str(por_sku[prod.sku]).replace('Z', '+00:00')
                    )
                except (ValueError, TypeError):
                    continue
                if dt.tzinfo is None:
                    dt = timezone.make_aware(dt)
                # Nunca avanzar más allá del último cambio real de stock
                if prod.stock_updated_at and dt > prod.stock_updated_at:
                    dt = prod.stock_updated_at
                if prod.stock_pushed_at and dt <= prod.stock_pushed_at:
                    continue
                # queryset.update: no llama Product.save() → no re-dispara el
                # hook de stock ni invalida la caché del catálogo.
                Product.objects.filter(pk=prod.pk).update(stock_pushed_at=dt)
                confirmados += 1
        return Response({'confirmados': confirmados})
