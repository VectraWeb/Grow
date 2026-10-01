# Tareas asíncronas de Celery para sincronización con servicios externos.
# Desacoplan la importación masiva de stock del hilo web principal → sin timeouts.
import logging
from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@shared_task(
    bind=True,
    name='apps.integrations.tasks.sync_meli_active_products',
    max_retries=3,
    default_retry_delay=120,   # Reintentar en 2 min si falla
    soft_time_limit=300,       # Timeout blando: 5 minutos
    time_limit=360,            # Timeout duro: 6 minutos
)
def sync_meli_active_products(self, product_ids: list = None):
    """
    Sincroniza stock de productos con Mercado Libre de forma asíncrona.
    
    Uso:
        sync_meli_active_products.delay()               # Todos los productos meli_sync=True
        sync_meli_active_products.delay([42, 99, 101])  # Productos específicos
    
    Activada: vía Celery Beat cada hora (settings.CELERY_BEAT_SCHEDULE)
    """
    from apps.inventory.models import Product

    try:
        qs = Product.objects.filter(meli_sync=True, is_active=True)
        if product_ids:
            qs = qs.filter(id__in=product_ids)

        products = list(qs.only('id', 'name', 'sku', 'stock_current', 'meli_item_id'))
        logger.info(f"[MeLi Sync] Iniciando sync de {len(products)} productos")

        results = {'synced': 0, 'skipped': 0, 'errors': 0}

        for product in products:
            try:
                from apps.integrations.services.meli import MeLiService
                if product.meli_item_id and not product.meli_item_id.endswith("MOCK"):
                    MeLiService.sync_stock_and_price(product.id)
                else:
                    MeLiService.publish_product(product.id)
                results['synced'] += 1
            except Exception as e:
                logger.error(f"[MeLi Sync] Error en producto {product.sku}: {e}")
                results['errors'] += 1

        logger.info(f"[MeLi Sync] Completado: {results}")
        return results

    except Exception as exc:
        logger.error(f"[MeLi Sync] Error crítico: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    name='apps.integrations.tasks.sync_google_sheets_async',
    max_retries=2,
    default_retry_delay=60,
    soft_time_limit=600,       # Las importaciones de Sheets pueden tardar más
    time_limit=660,
)
def sync_google_sheets_async(self, sheet_url: str, update_store_info: bool = True):
    """
    Importa/sincroniza stock desde Google Sheets de forma asíncrona.
    
    Uso desde la vista (en vez de llamar al servicio directamente):
        sync_google_sheets_async.delay(sheet_url, update_store_info=True)
    
    Retorna un dict con el resultado del sync para almacenar en IntegrationConfig.
    """
    try:
        from apps.integrations.services.google_sheets_service import GoogleSheetsSyncService
        from apps.integrations.models import IntegrationConfig
        from django.utils import timezone

        logger.info(f"[Sheets Sync] Iniciando sync desde {sheet_url[:60]}...")
        result = GoogleSheetsSyncService.sync('url', sheet_url, update_store_info=update_store_info)

        # Actualizar última sincronización en la config
        config = IntegrationConfig.objects.filter(integration_type='GOOGLE_SHEETS').first()
        if config:
            meta = config.metadata or {}
            meta['last_sync_summary'] = result
            config.metadata = meta
            config.last_sync = timezone.now()
            config.save(update_fields=['metadata', 'last_sync'])

        logger.info(f"[Sheets Sync] Completado: {result}")
        return result

    except Exception as exc:
        logger.error(f"[Sheets Sync] Error: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    name='apps.integrations.tasks.trigger_meli_sync_for_product',
    max_retries=3,
    default_retry_delay=30,
)
def trigger_meli_sync_for_product(product_id: int):
    """
    Dispara sync inmediato de un producto específico cuando su stock cambia.
    Llamar desde signals o vistas del inventario al actualizar stock.
    
    Uso:
        trigger_meli_sync_for_product.delay(product.id)
    """
    return sync_meli_active_products.delay(product_ids=[product_id])
