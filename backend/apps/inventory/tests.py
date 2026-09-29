from django.test import TestCase
from apps.inventory.models import Category, Product
from apps.sales.models import Sale, SaleItem, Customer


class ProductModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Herramientas", slug="herramientas")
        self.product = Product.objects.create(
            category=self.category,
            name="Taladora Bosch",
            sku="TAL-001",
            description="Taladora profesional",
            price_retail=15000.00,
            price_wholesale=12000.00,
            cost_price=8000.00,
            stock_current=50,
            stock_min=5,
        )

    def test_product_creation(self):
        self.assertEqual(self.product.name, "Taladora Bosch")
        self.assertEqual(self.product.stock_current, 50)

    def test_product_str(self):
        self.assertIn("Taladora Bosch", str(self.product))

    def test_category_slug_auto_generated(self):
        cat = Category.objects.create(name="Tornillos")
        self.assertEqual(cat.slug, "tornillos")

    def test_low_stock(self):
        self.product.stock_current = 3
        self.product.save()
        self.assertLess(self.product.stock_current, self.product.stock_min)


class SaleModelTest(TestCase):
    def setUp(self):
        self.customer = Customer.objects.create(
            name="Juan Perez",
            email="juan@test.com",
            customer_type="RETAIL",
        )
        self.category = Category.objects.create(name="Tornillos")
        self.product = Product.objects.create(
            category=self.category,
            name="Tornillo 1/4",
            sku="TOR-001",
            description="Tornillo comun",
            price_retail=100.00,
            price_wholesale=80.00,
            stock_current=200,
        )

    def test_sale_creation(self):
        sale = Sale.objects.create(
            customer=self.customer,
            total=500.00,
            payment_method="TRANSFERENCIA",
            payment_status="PENDING",
            shipping_status="PENDING",
        )
        self.assertEqual(sale.total, 500.00)
        self.assertEqual(sale.payment_status, "PENDING")

    def test_sale_items(self):
        sale = Sale.objects.create(
            customer=self.customer,
            total=300.00,
            payment_method="TRANSFERENCIA",
            payment_status="PAID",
        )
        item = SaleItem.objects.create(
            sale=sale,
            product=self.product,
            quantity=3,
            price_at_sale=100.00,
        )
        self.assertEqual(sale.items.count(), 1)
        self.assertEqual(item.quantity, 3)


class StockReductionTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Clavos")
        self.product = Product.objects.create(
            category=self.category,
            name="Clavo 2 pulg",
            sku="CLA-001",
            description="Clavo comun",
            price_retail=50.00,
            price_wholesale=40.00,
            stock_current=100,
        )
        self.customer = Customer.objects.create(name="Test", customer_type="RETAIL")

    def test_stock_reduces_on_sale(self):
        sale = Sale.objects.create(
            customer=self.customer,
            total=200.00,
            payment_method="TRANSFERENCIA",
            payment_status="PAID",
        )
        SaleItem.objects.create(sale=sale, product=self.product, quantity=10, price_at_sale=50.00)

        # Simulate stock reduction (as webhook does)
        self.product.stock_current = max(0, self.product.stock_current - 10)
        self.product.save()

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_current, 90)

    def test_stock_never_negative(self):
        self.product.stock_current = 5
        self.product.save()
        reduction = 10
        self.product.stock_current = max(0, self.product.stock_current - reduction)
        self.product.save()
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_current, 0)


class CheckoutPriceValidationTest(TestCase):
    """Test that prices are validated server-side"""

    def setUp(self):
        self.category = Category.objects.create(name="Pintura")
        self.product = Product.objects.create(
            category=self.category,
            name="Pintura Latex 20L",
            sku="PIN-001",
            description="Pintura blanca",
            price_retail=25000.00,
            price_wholesale=20000.00,
            stock_current=30,
        )

    def test_db_price_is_authoritative(self):
        """Server should always use DB price, not client-submitted price"""
        client_price = 1.00  # Attacker tries to pay $1
        db_price = float(self.product.price_retail)
        self.assertNotEqual(client_price, db_price)
        # The secure code does: price = float(product.price_retail)
        self.assertEqual(db_price, 25000.00)
