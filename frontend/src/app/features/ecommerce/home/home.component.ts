// Página de inicio y catálogo del e-commerce: productos, banners y promociones
// Muestra tienda en línea para compra de clientes
import { Component, OnInit, OnDestroy, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { ApiService } from "../../../core/services/api.service";
import { CartService } from "../../../core/services/cart.service";
import { NavigationService } from "../../../core/services/navigation.service";
import { Router, ActivatedRoute } from "@angular/router";
import { SeoService } from "../../../core/services/seo.service";

interface Product {
  id: number;
  name: string;
  price_retail: string;
  image: string;
  category_name?: string;
  rating?: number;
  reviews_count?: number;
  stock_current?: number;
  discount_percentage?: number;
  search_slug?: string;
}

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  is_active: boolean;
}

import {
  LucideAngularModule,
  ShoppingCart,
  User,
  ArrowRight,
  Star,
  Zap,
  Truck,
  Shield,
  Search,
  ChevronRight,
  Filter,
  X,
  Hammer,
  Map,
  ShieldCheck,
  Store,
  MessageCircle,
  Instagram,
  Facebook,
} from "lucide-angular";
import { RouterModule } from "@angular/router";

import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";
import { MaterialCalculatorComponent } from "../../../shared/components/material-calculator/material-calculator.component";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RouterModule,
    FormsModule,
    ToastModule,
    MaterialCalculatorComponent,
  ],
  providers: [MessageService],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private cartService = inject(CartService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private seo = inject(SeoService);
  private sanitizer = inject(DomSanitizer);

  cartCount = 0;
  selectedCategory = "todos";
  searchQuery = "";
  filteredProducts: Product[] = [];
  displayedProducts: Product[] = [];
  displayLimit = 8;
  allProductsData: Product[] = []; // Cache for filtering
  isSearchExpanded = false;
  sortBy:
    | "relevancia"
    | "precio-asc"
    | "precio-desc"
    | "vendido"
    | "nuevo"
    | "todos" = "relevancia";

  selectedLegal: string | null = null;
  legalContent: any = {
    soporte: {
      title: "Soporte Técnico",
      icon: "🛠️",
      content:
        "Nuestro equipo técnico está disponible de Lunes a Viernes de 8:00 a 18:00 hs. Podés contactarnos vía WhatsApp al +54 9 3462 612989 para asesoría sobre repuestos, service oficial y reparaciones de herramientas eléctricas y manuales.",
    },
    garantias: {
      title: "Garantías Oficiales",
      icon: "🛡️",
      content:
        "Todos nuestros productos cuentan con garantía oficial. Las herramientas eléctricas tienen 6 meses de cobertura contra defectos de fabricación. Las herramientas manuales cuentan con garantía de por vida en fallas de material estructural.",
    },
    envios: {
      title: "Envíos y Entregas",
      icon: "🚚",
      content:
        "Realizamos envíos a todo el país vía Correo Argentino. El plazo de entrega es de 3 a 5 días hábiles en centros urbanos. También ofrecemos retiro en sucursal en 24hs hábiles para productos con stock inmediato.",
    },
    privacidad: {
      title: "Privacidad de Datos",
      icon: "🔐",
      content:
        "Tus datos están protegidos bajo estrictas normas de seguridad. Solo utilizamos tu información para procesar pedidos y enviarte actualizaciones relevantes. Nunca compartimos tu base de datos con terceros.",
    },
    terminos: {
      title: "Términos y Condiciones",
      icon: "📄",
      content:
        "Al operar en FerreNexo aceptás nuestras condiciones de venta. Los precios publicados incluyen IVA. Las ofertas son válidas hasta agotar stock. Nos reservamos el derecho de cancelar pedidos ante errores evidentes de publicación.",
    },
  };

  // Make Math available in template
  // make Math available in template
  Math = Math;


  whatsappHref = "";
  whatsappHrefConsult = "";
  storeAddress = "";
  mapSafeUrl: SafeResourceUrl = "";
  instagramUrl = "";
  facebookUrl = "";

  getMapsLink(): string {
    return 'https://maps.google.com/?q=' + encodeURIComponent(this.storeAddress);
  }

  currentSlide = 0;
  banners: Banner[] = [];
  private carouselInterval: any;
  private touchStartX = 0;
  private touchEndX = 0;

  ShoppingCart = ShoppingCart;
  User = User;
  ArrowRight = ArrowRight;
  Star = Star;
  Zap = Zap;
  Truck = Truck;
  Shield = Shield;
  Search = Search;
  ChevronRight = ChevronRight;
  Filter = Filter;
  X = X;
  Hammer = Hammer;
  Map = Map;
  ShieldCheck = ShieldCheck;
  Store = Store;
  MessageCircle = MessageCircle;
  Instagram = Instagram;
  Facebook = Facebook;

  ngOnInit(): void {
    this.seo.updateMetaTags({
      title: "Inicio - Herramientas Industriales",
      description:
        "Explora nuestro catálogo premium de herramientas y materiales de construcción.",
    });

    const savedY = sessionStorage.getItem('homeScrollY');
    if (savedY) {
      sessionStorage.removeItem('homeScrollY');
      setTimeout(() => window.scrollTo({ top: +savedY, behavior: 'instant' }), 0);
    }

    // Fetch tenant dynamic info for Whatsapp links and address
    this.api.get<any>('/tenant/info/').subscribe({
      next: (data) => {
        if (data.whatsapp_number) {
          const cleanNumber = data.whatsapp_number.replace(/\D/g, '');
          this.whatsappHref = `https://wa.me/${cleanNumber}`;
          this.whatsappHrefConsult = `https://wa.me/${cleanNumber}?text=Hola,%20me%20gustaría%20recibir%20asesoría%20sobre%20herramientas%20para%20mi%20proyecto`;
        }
        if (data.store_address) {
          this.storeAddress = data.store_address;
          this.mapSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            'https://maps.google.com/maps?q=' + encodeURIComponent(data.store_address) + '&t=&z=15&ie=UTF8&iwloc=&output=embed'
          );
        }
        if (data.instagram_url) {
          this.instagramUrl = data.instagram_url;
        }
        if (data.facebook_url) {
          this.facebookUrl = data.facebook_url;
        }
      }
    });

    // Load base products
    this.api.get<any>("/ecommerce/banners/").subscribe({
      next: (res) => {
        const data = res.results || res;
        this.banners = data.filter((b: Banner) => b.is_active);
        if (this.banners.length > 0) {
          this.startCarousel();
        }
      },
      error: () => {
        this.banners = [];
      }
    });

    // Load and refresh products
    this.loadAllProducts();

    // Subscribe to cart changes
    this.cartService.cart$.subscribe(() => {
      this.updateCartCount();
    });
    this.cartService.loadCart();

    // Refresh products when returning to this route
    this.route.queryParams.subscribe(() => {
      this.loadAllProducts();
    });

    // Subscribe to navigation changes
    this.navigationService.searchQuery$.subscribe((query) => {
      this.searchQuery = query;
      this.applyFilters();
    });

    let isFirstLoad = true;
    this.navigationService.category$.subscribe((category) => {
      this.selectedCategory = category;
      this.applyFilters();

      // Auto-scroll to catalog when making a selection
      if (!isFirstLoad) {
        setTimeout(() => {
          const catalogElement = document.getElementById("catalog");
          if (catalogElement) {
            const y =
              catalogElement.getBoundingClientRect().top + window.scrollY - 100; // Account for fixed header
            window.scrollTo({ top: y, behavior: "smooth" });
          }
        }, 50);
      }
      isFirstLoad = false;
    });

    // Cerrar búscador al hacer clic afuera
    document.addEventListener("click", (event: any) => {
      const searchContainer = document.querySelector("[data-search-container]");
      if (searchContainer && !searchContainer.contains(event.target)) {
        this.closeSearch();
      }
    });
  }

  private loadAllProducts(): void {
    // Load products from API (PostgreSQL)
    this.api.get<Product[]>("/products/").subscribe((products) => {
      // Handle both paginated and non-paginated responses
      const rawProducts = (products as any).results || products;

      // Normalize image URLs and pre-calculate slugs
      this.allProductsData = rawProducts.map((p: Product) => {
        if (p.image && !p.image.startsWith("http")) {
          // If image is relative (e.g. /media/products/img.jpg), prepend the backend host
          // The API base is http://127.0.0.1:8000/api, so media host is http://127.0.0.1:8000
          p.image = `http://127.0.0.1:8000${p.image}`;
        }
        if (p.category_name) {
          p.search_slug = p.category_name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-");
        }
        return p;
      });

      this.filteredProducts = this.allProductsData;
      this.applyFilters();
      this.updateCartCount();
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  applyFilters(): void {
    // Filter products from API cache
    let filtered = [...this.allProductsData];

    if (this.selectedCategory !== "todos") {
      const searchSlug = this.selectedCategory
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");

      filtered = filtered.filter((p) => {
        if (this.selectedCategory === "ofertas") return true;
        if (!p.search_slug) return false;
        return p.search_slug.includes(searchSlug);
      });
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category_name?.toLowerCase().includes(query),
      );
    }

    // Apply sorting
    filtered = this.applySorting(filtered);

    this.filteredProducts = filtered;
    this.displayLimit = 8;
    this.displayedProducts = this.filteredProducts.slice(0, this.displayLimit);
  }

  loadMore(): void {
    this.displayLimit += 8;
    this.displayedProducts = this.filteredProducts.slice(0, this.displayLimit);
  }

  applySorting(products: Product[]): Product[] {
    const sorted = [...products];

    switch (this.sortBy) {
      case "precio-asc":
        return sorted.sort(
          (a, b) => parseFloat(a.price_retail) - parseFloat(b.price_retail),
        );
      case "precio-desc":
        return sorted.sort(
          (a, b) => parseFloat(b.price_retail) - parseFloat(a.price_retail),
        );
      case "vendido":
        return sorted.sort(
          (a, b) => (b.reviews_count || 0) - (a.reviews_count || 0),
        );
      case "nuevo":
        return sorted.sort((a, b) => b.id - a.id);
      case "relevancia":
      default:
        return sorted;
    }
  }

  setSortBy(
    sort:
      | "relevancia"
      | "precio-asc"
      | "precio-desc"
      | "vendido"
      | "nuevo"
      | "todos",
  ): void {
    if (sort === "todos") {
      this.selectedCategory = "todos";
      this.searchQuery = "";
      this.sortBy = "relevancia";
      this.applyFilters();
      return;
    }
    this.sortBy = sort;
    this.applyFilters();
  }

  toggleSearchExpanded(): void {
    this.isSearchExpanded = !this.isSearchExpanded;
  }

  closeSearch(): void {
    this.isSearchExpanded = false;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  addToCart(product: Product): void {
    this.cartService
      .addToCart(
        product.id,
        1,
        product.name,
        product.price_retail,
        product.image,
      )
      .subscribe({
        next: () => {
          this.showNotification(`${product.name} agregado al carrito`);
          this.cartService.openDrawer();
        },
        error: () => {
          alert("Error al agregar al carrito");
        },
      });
  }

  goToCart(): void {
    this.router.navigate(["/cart"]);
  }

  private updateCartCount(): void {
    this.cartCount = this.cartService.getCartItemCount();
  }

  private showNotification(message: string): void {
    // Notification removed as per user request
    // this.messageService.add({ severity: 'success', summary: 'Agregado al carrito', detail: message, life: 3000 });
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  getDiscountedPrice(product: Product): number {
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

  private generateSessionId(): string {
    const id = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("cart_session_id", id);
    return id;
  }

  scrollToCatalog(): void {
    const catalogElement = document.getElementById("catalog");
    if (catalogElement) {
      const y =
        catalogElement.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  openLegal(type: string): void {
    this.selectedLegal = type;
    document.body.style.overflow = "hidden";
  }

  closeLegal(): void {
    this.selectedLegal = null;
    document.body.style.overflow = "auto";
  }

  scrollToCategory(catName: string): void {
    this.filterByCategory(catName);
    this.scrollToCatalog();
  }

  startCarousel(): void {
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 3500);
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.banners.length;
  }

  setSlide(index: number): void {
    this.currentSlide = index;
    // Reset interval on manual change
    clearInterval(this.carouselInterval);
    this.startCarousel();
  }

  // User-triggered next (resets interval)
  userNextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.banners.length;
    clearInterval(this.carouselInterval);
    this.startCarousel();
  }

  // User-triggered prev (resets interval)
  userPrevSlide(): void {
    this.currentSlide =
      (this.currentSlide - 1 + this.banners.length) % this.banners.length;
    clearInterval(this.carouselInterval);
    this.startCarousel();
  }

  onTouchStart(event: TouchEvent): void {
    if (!event.changedTouches || event.changedTouches.length === 0) return;
    this.touchStartX = event.changedTouches[0].clientX;
  }

  onTouchEnd(event: TouchEvent): void {
    if (!event.changedTouches || event.changedTouches.length === 0) return;
    this.touchEndX = event.changedTouches[0].clientX;
    const diff = this.touchStartX - this.touchEndX;
    const threshold = 40; // swipe threshold in px
    if (diff > threshold) {
      // swipe left -> next
      this.userNextSlide();
    } else if (diff < -threshold) {
      // swipe right -> prev
      this.userPrevSlide();
    }
  }

  ngOnDestroy(): void {
    sessionStorage.setItem('homeScrollY', String(window.scrollY));
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }
}
