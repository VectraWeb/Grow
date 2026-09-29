from django.contrib import admin
from apps.sales.models import Sale, SaleItem, Customer, Ticket, Budget, BudgetItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price_at_sale', 'subtotal')


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'total', 'payment_method', 'payment_status', 'shipping_status', 'created_at')
    list_filter = ('payment_status', 'shipping_status', 'payment_method', 'created_at')
    search_fields = ('customer__name', 'customer__cuit', 'shipping_address')
    list_editable = ('payment_status', 'shipping_status')
    ordering = ('-created_at',)
    inlines = [SaleItemInline]
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Información del Pedido', {
            'fields': ('customer', 'total', 'payment_method', 'payment_status', 'shipping_status')
        }),
        ('Envío', {
            'fields': ('shipping_address', 'tracking_number')
        }),
        ('Mercado Pago', {
            'fields': ('mp_preference_id', 'mp_payment_id'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at',)
        }),
    )


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'cuit', 'customer_type', 'total_spent')
    list_filter = ('customer_type',)
    search_fields = ('name', 'cuit')


class BudgetItemInline(admin.TabularInline):
    model = BudgetItem
    extra = 0


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'total', 'status', 'valid_until', 'created_at')
    list_filter = ('status',)
    inlines = [BudgetItemInline]


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'subject', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('subject', 'description')
