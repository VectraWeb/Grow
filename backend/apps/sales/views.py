# Vistas (ViewSets) que realizan operaciones CRUD sobre ventas y clientes
# Maneja creación de pedidos, actualización de estado de entrega y reportes de ventas
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.sales.models import Sale, Customer, Ticket, Budget, BudgetItem
from apps.sales.serializers import SaleSerializer, CustomerSerializer, TicketSerializer
from apps.sales.budget_serializers import BudgetSerializer
from django.core.mail import send_mail
from django.conf import settings

class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all().order_by('-created_at')
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def convert_to_sale(self, request, pk=None):
        """ Converts this budget into a concrete Sale, reducing stock. """
        budget = self.get_object()
        if budget.status == 'ACCEPTED':
            return Response({"error": "Budget already accepted"}, status=400)
            
        # Create Sale
        from apps.sales.serializers import SaleSerializer
        sale_data = {
            'customer': budget.customer.id if budget.customer else None,
            'total': budget.total,
            'payment_status': 'PAID', # Default or pending
        }
        
        # Prepare items for SaleSerializer
        items = []
        for b_item in budget.items.all():
            items.append({
                'product': b_item.product.id,
                'quantity': b_item.quantity,
                'price_at_sale': b_item.price_at_budget
            })
            
        serializer = SaleSerializer(data=sale_data, context={'items': items})
        if serializer.is_valid():
            serializer.save()
            budget.status = 'ACCEPTED'
            budget.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by('-created_at')
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def send_shipping_email(self, request, pk=None):
        """ Sends shipping notification email to customer """
        sale = self.get_object()
        if not sale.customer or not sale.customer.email:
            return Response({"error": "No se encontro el email del cliente"}, status=400)
            
        items_list = ""
        for item in sale.items.all():
            items_list += f"- {item.product.name} (x{item.quantity}) - ${item.subtotal}\n"
            
        subject = f"Tu pedido #{sale.id} esta en camino!"
        message = (
            f"Hola {sale.customer.name},\n\n"
            f"Tu pedido #{sale.id} ya ha sido enviado y esta en camino a: {sale.shipping_address}.\n\n"
            f"Detalle de tu compra:\n{items_list}\nTotal: ${sale.total}\n\n"
            f"Gracias por confiar en FerreNexo!"
        )
        
        from django.core.mail import send_mail
        send_mail(
            subject, message,
            settings.DEFAULT_FROM_EMAIL or 'noreply@ferrenexo.com',
            [sale.customer.email],
            fail_silently=True,
        )
        
        return Response({"status": "success", "message": f"Email enviado a {sale.customer.email}"})

    @action(detail=True, methods=['post'])
    def send_payment_confirmation(self, request, pk=None):
        """ Sends payment confirmation email to customer """
        sale = self.get_object()
        if not sale.customer or not sale.customer.email:
            return Response({"error": "No se encontro el email del cliente"}, status=400)
            
        items_list = ""
        for item in sale.items.all():
            items_list += f"- {item.product.name} (x{item.quantity}) - ${item.subtotal}\n"
            
        subject = f"Pago confirmado - Pedido #{sale.id}"
        message = (
            f"Hola {sale.customer.name},\n\n"
            f"Tu pago de la orden #{sale.id} ha sido procesado exitosamente.\n\n"
            f"Detalle:\n{items_list}\nTotal pagado: ${sale.total}\n\n"
            f"Estamos preparando tu pedido. Te notificaremos cuando sea enviado.\n\n"
            f"FerreNexo"
        )
        
        from django.core.mail import send_mail
        send_mail(
            subject, message,
            settings.DEFAULT_FROM_EMAIL or 'noreply@ferrenexo.com',
            [sale.customer.email],
            fail_silently=True,
        )
        
        return Response({"status": "success", "message": f"Email enviado a {sale.customer.email}"})

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]
