# Sitemap dinámico para Tierra Verde Grow.
# Se registra en urls_public.py y se referencia en robots.txt.
# Google lo indexa automáticamente para mejorar el crawl budget.
from django.contrib.sitemaps import Sitemap
from django.utils import timezone
from apps.inventory.models import Product, Category


class ProductSitemap(Sitemap):
    """
    Sitemap de productos del catálogo e-commerce.
    Prioridad alta: los productos son el contenido clave para SEO.
    """
    changefreq = 'daily'
    priority = 0.9
    protocol = 'https'
    limit = 5000  # Máximo por sitemap XML

    def items(self):
        return (
            Product.objects
            .filter(is_active=True, is_ecommerce=True)
            .only('id', 'updated_at', 'category__slug')
            .select_related('category')
            .order_by('-updated_at')
        )

    def location(self, obj):
        # Coincide con la ruta Angular: /product/:id
        return f'/product/{obj.id}'

    def lastmod(self, obj):
        return obj.updated_at


class CategorySitemap(Sitemap):
    """
    Sitemap de categorías del catálogo.
    Prioridad media: páginas de listado con buen potencial SEO.
    """
    changefreq = 'weekly'
    priority = 0.7
    protocol = 'https'

    def items(self):
        return Category.objects.all().only('id', 'slug', 'created_at')

    def location(self, obj):
        # Coincide con la ruta Angular: /?category=:slug
        return f'/?category={obj.slug}'

    def lastmod(self, obj):
        return obj.created_at


class StaticPagesSitemap(Sitemap):
    """
    Sitemap de páginas estáticas: home, calculadora, contacto.
    """
    changefreq = 'monthly'
    priority = 0.5
    protocol = 'https'

    def items(self):
        return ['home', 'calculator']

    def location(self, item):
        mapping = {
            'home': '/',
            'calculator': '/calculadora',
        }
        return mapping.get(item, '/')

    def lastmod(self, item):
        return timezone.now()


# Diccionario exportable para registrar en urls.py
SITEMAPS = {
    'products': ProductSitemap,
    'categories': CategorySitemap,
    'static': StaticPagesSitemap,
}
