import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ApiService } from "../../../core/services/api.service";
import { CartService } from "../../../core/services/cart.service";
import { RatingService } from "../../../core/services/rating.service";
import {
  LucideAngularModule,
  ShoppingCart,
  Star,
  Truck,
  Shield,
  ArrowLeft,
  Plus,
  Minus,
  Heart,
  Hammer,
  ChevronLeft,
  ChevronRight,
} from "lucide-angular";
import { FormsModule } from "@angular/forms";
import { MaterialCalculatorComponent } from "../../../shared/components/material-calculator/material-calculator.component";

interface ProductDetail {
  id: number;
  name: string;
  price_retail: string;
  image: string;
  category_name?: string;
  description: string;
  rating: number;
  reviews: number;
  stock: number;
  brand: string;
  material: string;
  weight: string;
  dimensions: string;
  warranty: string;
  specifications: string[];
  discount_percentage?: number;
}

import { SeoService } from "../../../core/services/seo.service";

@Component({
  selector: "app-product-detail",
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, FormsModule, MaterialCalculatorComponent],
  templateUrl: "./product-detail.component.html",
  styleUrls: ["./product-detail.component.css"],
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private cartService = inject(CartService);
  private ratingService = inject(RatingService);
  private seo = inject(SeoService);

  product: ProductDetail | null = null;
  quantity: number = 1;
  isFavorite: boolean = false;
  selectedPaymentMethod: string = "credit-card";
  isAddingToCart: boolean = false;
  userRating: number = 0;
  hoverRating: number = 0;
  averageRating: number = 0;
  totalReviews: number = 0;
  isLoading: boolean = true;
  related: any[] = [];

  // Shipping logic
  zipCode: string = "";
  shippingResult: any = null;
  shippingError: string = "";
  isCalculatingShipping: boolean = false;

  Math = Math;
  parseInt = parseInt;
  whatsappHref = "";

  ShoppingCart = ShoppingCart;
  Star = Star;
  Truck = Truck;
  Shield = Shield;
  ArrowLeft = ArrowLeft;
  Plus = Plus;
  Minus = Minus;
  Heart = Heart;
  Hammer = Hammer;
  ChevronLeft = ChevronLeft;
  ChevronRight = ChevronRight;

  productImages: string[] = [];
  currentImageIndex: number = 0;

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: "instant" });

    this.api.get<any>("/tenant/info/").subscribe({
      next: (data) => {
        if (data.whatsapp_number) {
          const cleanNumber = data.whatsapp_number.replace(/\D/g, "");
          this.whatsappHref = `https://wa.me/${cleanNumber}`;
        }
      },
    });

    this.route.params.subscribe((params) => {
      const productId = parseInt(params["id"], 10);
      this.isLoading = true;

      this.api.get<any>(`/products/${productId}/`).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Normalize image URL
          let imageUrl =
            response.image ||
            "https://via.placeholder.com/500x500?text=Producto";
          if (imageUrl && !imageUrl.startsWith("http")) {
            imageUrl = `http://127.0.0.1:8000${imageUrl}`;
          }

          this.product = {
            id: response.id,
            name: response.name,
            price_retail: response.price_retail?.toString() || "0",
            image: imageUrl,
            category_name: response.category_name || "Sin categoría",
            description: response.description || "Producto sin descripción",
            rating: response.rating || 0,
            reviews: response.reviews_count || 0,
            stock: response.stock_current || 0,
            brand: response.brand || "N/A",
            material: response.material || "N/A",
            weight: response.weight || "N/A",
            dimensions: response.dimensions || "N/A",
            warranty: response.warranty || "Sin garantía",
            specifications: Array.isArray(response.specifications)
              ? response.specifications
              : response.specifications
                ? [response.specifications]
                : [],
            discount_percentage: response.discount_percentage || 0,
          };

          this.productImages = response.images?.length ? response.images.map((img: string) => img.startsWith('http') ? img : `http://127.0.0.1:8000${img}`) : [imageUrl];
          this.currentImageIndex = 0;

          this.seo.updateMetaTags({
            title: this.product.name,
            description: this.product.description.substring(0, 160),
            image: this.product.image,
          });

          this.loadUserRating(productId);
          this.loadProductRatings(productId);

          // Load related products by category
          if (response.category) {
            this.api
              .get<any>(`/products/`, {
                category: response.category,
                is_ecommerce: "true",
              })
              .subscribe({
                next: (res) => {
                  const list = (res.results || res)
                    .filter((x: any) => x.id !== this.product!.id)
                    .slice(0, 8);
                  this.related = list.map((r: any) => ({
                    ...r,
                    image:
                      r.image && r.image.startsWith("http")
                        ? r.image
                        : `http://127.0.0.1:8000${r.image}`,
                  }));
                },
                error: () => {
                  this.related = [];
                },
              });
          }
        },
        error: (err) => {
          console.error("Error loading product", err);
          this.isLoading = false;
          this.router.navigate(["/"]);
        },
      });
    });
  }

  private loadUserRating(productId: number): void {
    this.ratingService.getUserRating(productId).subscribe({
      next: (data: any) => {
        this.userRating = data.rating || 0;
      },
      error: (err) => {
        console.error("Error loading user rating:", err);
        this.userRating = 0;
      },
    });
  }

  private loadProductRatings(productId: number): void {
    this.ratingService.getProductRatings(productId).subscribe({
      next: (data) => {
        this.averageRating = data.average_rating || 0;
        this.totalReviews = data.total_reviews || 0;
      },
      error: (err) => {
        console.error("Error loading product ratings:", err);
        this.averageRating = 0;
        this.totalReviews = 0;
      },
    });
  }

  updateQuantity(value: number): void {
    this.quantity = Math.max(1, Math.min(value, this.product?.stock || 1));
  }

  prevImage(): void {
    this.currentImageIndex = this.currentImageIndex > 0 ? this.currentImageIndex - 1 : this.productImages.length - 1;
  }

  nextImage(): void {
    this.currentImageIndex = this.currentImageIndex < this.productImages.length - 1 ? this.currentImageIndex + 1 : 0;
  }

  getCurrentImage(): string {
    return this.productImages[this.currentImageIndex] || this.product?.image || '';
  }

  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
  }

  addToCart(): void {
    if (!this.product) return;

    this.isAddingToCart = true;
    this.cartService
      .addToCart(
        this.product.id,
        this.quantity,
        this.product.name,
        this.product.price_retail,
        this.product.image,
      )
      .subscribe({
        next: () => {
          this.isAddingToCart = false;
          this.showNotification(
            `✅ ${this.quantity} artículo(s) agregado(s) al carrito`,
          );
          this.quantity = 1;
          this.cartService.openDrawer();
        },
        error: () => {
          this.isAddingToCart = false;
          this.showNotification("❌ Error al agregar al carrito", true);
        },
      });
  }

  buyNow(): void {
    this.addToCart();
  }

  getDiscountedPrice(product: ProductDetail | null): number {
    if (!product) return 0;
    const price = parseFloat(product.price_retail);
    const discount = product.discount_percentage || 0;
    if (discount > 0) {
      return Math.round(price * (1 - discount / 100));
    }
    return price;
  }

  formatPrice(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '0';
    return Math.round(num).toLocaleString('es-AR');
  }

  setRating(stars: number): void {
    this.userRating = Math.max(1, Math.min(5, Math.round(stars)));
    this.saveUserRating();
  }

  onStarHover(stars: number): void {
    this.hoverRating = stars;
  }

  onStarLeave(): void {
    this.hoverRating = 0;
  }

  private saveUserRating(): void {
    if (!this.product) return;

    const validRating = Math.max(1, Math.min(5, Math.round(this.userRating)));

    this.ratingService.rateProduct(this.product.id, validRating).subscribe({
      next: () => {
        // Reload product ratings after saving
        this.loadProductRatings(this.product!.id);

        // Show notification
        this.showNotification(
          `⭐ Gracias por calificar con ${validRating} estrella${validRating > 1 ? "s" : ""}`,
        );
      },
      error: (err) => {
        console.error("Error saving rating:", err);
        this.showNotification("❌ Error al guardar la calificación", true);
      },
    });
  }

  private showNotification(message: string, isError: boolean = false): void {
    // Notification disabled as per user request
    /*
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.className = `fixed bottom-4 right-4 ${
      isError ? "bg-red-500" : "bg-green-500"
    } text-white px-6 py-3 rounded-xl font-bold shadow-lg z-50`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
    */
  }

  goBack(): void {
    this.router.navigate(["/"]);
  }

  calculateShipping(): void {
    if (!this.product || !this.zipCode.trim()) return;

    this.isCalculatingShipping = true;
    this.shippingError = "";
    this.shippingResult = null;

    this.api
      .post<any>(`/products/${this.product.id}/calculate_shipping/`, {
        zip_code: this.zipCode,
      })
      .subscribe({
        next: (res) => {
          this.shippingResult = res;
          this.isCalculatingShipping = false;
        },
        error: (err) => {
          console.error("Error calculating shipping", err);
          this.shippingError =
            err.error?.error ||
            "No se pudo calcular el envío. Verifica el código postal.";
          this.isCalculatingShipping = false;
        },
      });
  }
}
