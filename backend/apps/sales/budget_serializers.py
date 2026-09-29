from rest_framework import serializers
from apps.sales.models import Budget, BudgetItem

class BudgetItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = BudgetItem
        fields = ('id', 'product', 'product_name', 'quantity', 'price_at_budget', 'subtotal')

class BudgetSerializer(serializers.ModelSerializer):
    items = BudgetItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = Budget
        fields = '__all__'
    
    def create(self, validated_data):
        items_data = self.context.get('items', [])
        budget = Budget.objects.create(**validated_data)
        for item in items_data:
            BudgetItem.objects.create(budget=budget, **item)
        return budget
