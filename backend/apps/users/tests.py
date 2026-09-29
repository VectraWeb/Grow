from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.users.models import StoreConfig

User = get_user_model()


class StoreSettingsAuthTest(TestCase):
    """Test that POST/PATCH to store settings requires auth"""

    def setUp(self):
        self.client = APIClient()
        self.config = StoreConfig.objects.create(
            name="Test Store",
            store_address="Av. Test 123",
            whatsapp_number="5491123456789",
        )

    def test_post_requires_auth(self):
        resp = self.client.post("/api/tenant/settings/", {"store_address": "Hacked"})
        self.assertIn(resp.status_code, [401, 403])

    def test_patch_requires_auth(self):
        resp = self.client.patch("/api/tenant/settings/", {"store_address": "Hacked"})
        self.assertIn(resp.status_code, [401, 403])

    def test_post_requires_staff(self):
        user = User.objects.create_user(email="user@test.com", password="test123", role="CUSTOMER")
        self.client.force_authenticate(user=user)
        resp = self.client.post("/api/tenant/settings/", {"store_address": "Hacked"})
        self.assertIn(resp.status_code, [401, 403])

    def test_post_allowed_for_staff(self):
        user = User.objects.create_superuser(email="admin@test.com", password="admin123")
        self.client.force_authenticate(user=user)
        resp = self.client.post(
            "/api/tenant/settings/",
            {"store_address": "New Address"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)


class StoreInfoPublicTest(TestCase):
    """Test that store info is publicly accessible"""

    def setUp(self):
        self.client = APIClient()
        self.config = StoreConfig.objects.create(
            name="Mi Ferreteria",
            store_address="Av. Corrientes 1234",
        )

    def test_get_store_info(self):
        resp = self.client.get("/api/tenant/info/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["name"], "Mi Ferreteria")
        self.assertEqual(data["store_address"], "Av. Corrientes 1234")


class PasswordResetTest(TestCase):
    """Test password reset flow"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test@test.com",
            password="oldpass123",
            role="CUSTOMER",
        )

    def test_request_reset_returns_ok(self):
        resp = self.client.post(
            "/api/auth/password-reset/",
            {"email": "test@test.com", "frontend_url": "http://localhost:4200"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)

    def test_request_reset_always_returns_ok_even_if_email_not_found(self):
        """Should not reveal if email exists"""
        resp = self.client.post(
            "/api/auth/password-reset/",
            {"email": "nonexistent@test.com", "frontend_url": "http://localhost:4200"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)


class CustomerRegisterTest(TestCase):
    """Test customer registration"""

    def setUp(self):
        self.client = APIClient()

    def test_register_new_customer(self):
        resp = self.client.post(
            "/api/auth/register/",
            {
                "email": "new@test.com",
                "password": "pass1234",
                "first_name": "Juan",
                "last_name": "Perez",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)

    def test_register_duplicate_email(self):
        User.objects.create_user(email="dup@test.com", password="pass123", role="CUSTOMER")
        resp = self.client.post(
            "/api/auth/register/",
            {"email": "dup@test.com", "password": "pass1234", "first_name": "Test"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)
