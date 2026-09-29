from rest_framework import serializers
from apps.integrations.models import ProductPublication


class ProductPublicationSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ProductPublication
        fields = [
            'id', 'product', 'product_name', 'channel', 'channel_display',
            'channel_publication_id', 'publication_url', 'status', 'status_display',
            'error_message', 'last_sync', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class PublishRequestSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    channel = serializers.ChoiceField(choices=ProductPublication.CHANNEL_CHOICES)


class UpdateRequestSerializer(serializers.Serializer):
    publication_id = serializers.IntegerField()


class DeleteRequestSerializer(serializers.Serializer):
    publication_id = serializers.IntegerField()
