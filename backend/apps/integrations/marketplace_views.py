import json
from django.http import HttpResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.inventory.models import Product
from apps.integrations.models import ProductPublication
from apps.integrations.marketplace_serializers import (
    ProductPublicationSerializer,
    PublishRequestSerializer,
    UpdateRequestSerializer,
    DeleteRequestSerializer,
)
from apps.integrations.services.registry import get_provider


class MarketplacePublishView(APIView):
    """Publish a product to a marketplace channel."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PublishRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']
        channel = serializer.validated_data['channel']

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        existing = ProductPublication.objects.filter(product=product, channel=channel).exclude(status='REMOVED').first()
        if existing and existing.status == 'PUBLISHED':
            return Response({'error': 'El producto ya está publicado en este canal.', 'publication_id': existing.id},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            provider = get_provider(channel)
            result = provider.publish(product)
        except Exception as e:
            return Response({'error': f'Error al publicar: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if result.get('status') == 'success':
            pub = ProductPublication.objects.filter(product=product, channel=channel).first()
            return Response({
                'message': result.get('message', 'Publicado exitosamente.'),
                'publication': ProductPublicationSerializer(pub).data if pub else None,
                'content': result.get('content'),
            })
        else:
            return Response({'error': result.get('message', 'Error desconocido.')}, status=status.HTTP_400_BAD_REQUEST)


class MarketplaceUpdateView(APIView):
    """Update an existing marketplace publication."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UpdateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            pub = ProductPublication.objects.get(id=serializer.validated_data['publication_id'])
        except ProductPublication.DoesNotExist:
            return Response({'error': 'Publicación no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            provider = get_provider(pub.channel)
            result = provider.update(pub, pub.product)
        except Exception as e:
            return Response({'error': f'Error al actualizar: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        pub.refresh_from_db()
        return Response({
            'message': result.get('message', 'Actualizado.'),
            'publication': ProductPublicationSerializer(pub).data,
            'content': result.get('content'),
        })


class MarketplaceDeleteView(APIView):
    """Delete a marketplace publication."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DeleteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            pub = ProductPublication.objects.get(id=serializer.validated_data['publication_id'])
        except ProductPublication.DoesNotExist:
            return Response({'error': 'Publicación no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            provider = get_provider(pub.channel)
            deleted = provider.delete(pub)
        except Exception as e:
            return Response({'error': f'Error al eliminar: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if deleted:
            return Response({'message': 'Publicación eliminada.'})
        return Response({'error': 'No se pudo eliminar la publicación.'}, status=status.HTTP_400_BAD_REQUEST)


class MarketplaceStatusView(APIView):
    """Get publication status for a specific product."""
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        pubs = ProductPublication.objects.filter(product=product).exclude(status='REMOVED')
        return Response(ProductPublicationSerializer(pubs, many=True).data)


class MarketplaceFacebookPreviewView(APIView):
    """Generate Facebook Marketplace preview content for a product."""
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        provider = get_provider('FACEBOOK')
        content = provider._prepare_content(product)
        return Response(content)
