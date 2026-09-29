from django.db import models

class IntegrationConfig(models.Model):
    """ Stores API keys and tokens for different integrations per tenant """
    INTEGRATION_CHOICES = (
        ('MELI', 'Mercado Libre'),
        ('CORREO_ARG', 'Correo Argentino'),
    )
    
    integration_type = models.CharField(max_length=20, choices=INTEGRATION_CHOICES)
    
    # Common fields
    client_id = models.CharField(max_length=255, null=True, blank=True)
    client_secret = models.CharField(max_length=255, null=True, blank=True)
    
    # Auth tokens
    access_token = models.TextField(null=True, blank=True)
    refresh_token = models.TextField(null=True, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    is_active = models.BooleanField(default=True)
    last_sync = models.DateTimeField(auto_now=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ('integration_type',) # One config per type per tenant

    def __str__(self):
        return f"{self.integration_type} Config"


class ProductPublication(models.Model):
    """Registry of product publications across marketplace channels."""

    CHANNEL_CHOICES = (
        ('MELI', 'Mercado Libre'),
        ('FACEBOOK', 'Facebook Marketplace'),
    )

    STATUS_CHOICES = (
        ('DRAFT', 'Borrador'),
        ('PENDING', 'Pendiente'),
        ('PUBLISHED', 'Publicado'),
        ('ERROR', 'Error'),
        ('REMOVED', 'Eliminado'),
    )

    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.CASCADE,
        related_name='publications'
    )
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    channel_publication_id = models.CharField(max_length=255, null=True, blank=True)
    publication_url = models.URLField(max_length=500, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    error_message = models.TextField(null=True, blank=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'channel')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product.name} → {self.channel} ({self.status})"
