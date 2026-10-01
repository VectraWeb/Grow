import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  updateTitle(title: string) {
    const fullTitle = `${title} | Tierra Verde Grow`;
    this.title.setTitle(fullTitle);
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
  }

  updateDescription(description: string) {
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  updateImage(imageUrl: string) {
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
  }

  updateMetaTags(data: { title: string; description: string; image?: string }) {
    this.updateTitle(data.title);
    this.updateDescription(data.description);
    if (data.image) {
      this.updateImage(data.image);
    }
  }

  /**
   * Inyecta JSON-LD de schema.org/Product en el <head>.
   * Esto habilita Rich Results en Google (precio, stock, estrellas) y
   * la aparición del producto en Google Shopping.
   */
  injectProductSchema(product: {
    id: number;
    name: string;
    description: string;
    sku: string;
    brand?: string;
    image?: string;
    price_retail: string | number;
    stock: number;
    averageRating?: number;
    totalReviews?: number;
    discount_percentage?: number;
    category_name?: string;
  }): void {
    // Eliminar schema anterior si existe (al navegar entre productos)
    this.removeSchema('product-schema');

    const price = parseFloat(String(product.price_retail));
    const discountedPrice = product.discount_percentage && +product.discount_percentage > 0
      ? Math.round(price * (1 - +product.discount_percentage / 100))
      : price;

    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description?.substring(0, 500) || '',
      sku: product.sku || String(product.id),
      brand: { '@type': 'Brand', name: product.brand || 'Tierra Verde Grow' },
      category: product.category_name || 'Growshop',
      image: product.image || '',
      offers: {
        '@type': 'Offer',
        priceCurrency: 'ARS',
        price: discountedPrice,
        itemCondition: 'https://schema.org/NewCondition',
        availability: product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Tierra Verde Grow',
          url: 'https://tierraverdegrow.com.ar',
        },
      },
    };

    // Agregar aggregate rating solo si hay reseñas
    if (product.totalReviews && product.totalReviews > 0) {
      schema['aggregateRating'] = {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating?.toFixed(1) || '0',
        reviewCount: product.totalReviews,
        bestRating: '5',
        worstRating: '1',
      };
    }

    const script = this.document.createElement('script');
    script.id = 'product-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  /** Inyecta JSON-LD de schema.org/Organization para la homepage */
  injectOrganizationSchema(data: {
    name: string;
    url: string;
    phone?: string;
    address?: string;
    logo?: string;
  }): void {
    this.removeSchema('org-schema');

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': data.url,
      name: data.name,
      url: data.url,
      telephone: data.phone || '',
      logo: data.logo || '',
      image: data.logo || '',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'AR',
      },
      sameAs: [
        'https://www.instagram.com/tierraverdegrow',
        'https://www.facebook.com/tierraverdegrow',
      ],
    };

    const script = this.document.createElement('script');
    script.id = 'org-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  /** Elimina un schema por ID para evitar duplicados al navegar */
  removeSchema(id: string): void {
    const existing = this.document.getElementById(id);
    if (existing) {
      existing.remove();
    }
  }
}
