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
import { environment } from "../../../../environments/environment";

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
  Sprout,
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
  isLoading = true;
  categories: any[] = [];
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
      title: "Asesoramiento de Cultivo",
      icon: "🌱",
      content:
        "Nuestro equipo de cultivadores está disponible de Lunes a Sábado de 10:00 a 20:00 hs. Podés consultarnos por WhatsApp sobre dosificación de fertilizantes, planes de nutrición, plagas, y armado de carpas indoor.",
    },
    garantias: {
      title: "Garantías de Equipamiento",
      icon: "🛡️",
      content:
        "Todos nuestros paneles LED Quantum Board, balastros y turbinas cuentan con garantía oficial de 12 meses ante cualquier falla de fábrica. Brindamos soporte técnico directo y recambio inmediato.",
    },
    envios: {
      title: "Envíos Discretos y Seguros",
      icon: "📦",
      content:
        "Realizamos envíos a todo el país. Todos los pedidos se despachan en embalajes 100% neutros, opacos y reforzados sin ningún logo ni descripción externa, protegiendo absolutamente tu privacidad.",
    },
    privacidad: {
      title: "Privacidad del Cultivador",
      icon: "🔐",
      content:
        "Tu privacidad es nuestra máxima prioridad. Tus datos de compra y envío están cifrados y nunca se comparten con terceros. Solo se utilizan con el único fin de hacerte llegar tu pedido.",
    },
    terminos: {
      title: "Términos y Condiciones",
      icon: "📄",
      content:
        "Al operar en Tierra Verde Grow aceptás nuestras condiciones de venta y garantía. Los precios publicados incluyen IVA. Todas las semillas comercializadas son para colección botánica y preservación genética según la legislación vigente.",
    },
  };

  // Make Math available in template
  Math = Math;

  whatsappHref = "";
  whatsappHrefConsult = "";
  storeAddress = "";
  mapSafeUrl: SafeResourceUrl = "";
  instagramUrl = "";
  facebookUrl = "";

  googleMapsUrl = 'https://www.google.com/maps/place/Tierra+Verde+Grow+Shop/@-34.5862498,-60.9528744,17z/data=!3m1!4b1!4m6!3m5!1s0x95b8eb303fd57963:0x1b23999f0e8342e!8m2!3d-34.5862498!4d-60.9502941!16s%2Fg%2F11nw6w766g';

  getMapsLink(): string {
    return this.googleMapsUrl;
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
  Sprout = Sprout;
  Map = Map;
  ShieldCheck = ShieldCheck;
  Store = Store;
  MessageCircle = MessageCircle;
  Instagram = Instagram;
  Facebook = Facebook;

  ngOnInit(): void {
    this.seo.updateMetaTags({
      title: "Tierra Verde Grow - Growshop | Cultivo Indoor & Outdoor",
      description:
        "Tu growshop de confianza. Fertilizantes orgánicos, sustratos premium, paneles LED Quantum Board, carpas indoor y parafernalia.",
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
          this.whatsappHrefConsult = `https://wa.me/${cleanNumber}?text=Hola,%20me%20gustaría%20recibir%20asesoría%20sobre%20productos%20para%20mi%20cultivo`;
        }
        if (data.store_address) {
          this.storeAddress = data.store_address;
          this.mapSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            'https://maps.google.com/maps?q=-34.5862498,-60.9502941&t=&z=16&ie=UTF8&iwloc=&output=embed'
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

    // Load base banners
    this.api.get<any>("/ecommerce/banners/").subscribe({
      next: (res) => {
        const data = res.results || res;
        this.banners = (data || []).filter((b: Banner) => b.is_active);
        if (this.banners.length === 0) {
          this.initFallbackBanners();
        } else {
          this.startCarousel();
        }
      },
      error: () => {
        this.initFallbackBanners();
      }
    });

    // Load categories for catalog quick filter chips
    this.api.get<any>("/categories/").subscribe({
      next: (res) => {
        const data = res.results || res;
        this.categories = (data || []).filter((c: any) => c.name && c.name !== 'General');
      }
    });

    // Subscribe to cart changes
    this.cartService.cart$.subscribe(() => {
      this.updateCartCount();
    });
    this.cartService.loadCart();

    // Subscribe to route params and load products
    this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        this.selectedCategory = params['category'];
      }
      if (params['search']) {
        this.searchQuery = params['search'];
      }
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

  private initFallbackBanners(): void {
    this.banners = [
      {
        id: 1,
        title: "Cultivo Indoor Pro",
        subtitle: "Luminarias LED Quantum Board y carpas de alta reflectancia",
        image: "assets/banner_indoor_grow.jpg",
        link: "",
        is_active: true,
      },
      {
        id: 2,
        title: "Nutrición & Sustratos",
        subtitle: "Fertilizantes orgánicos, bioestimulantes y mezclas profesionales",
        image: "assets/banner_nutrients.jpg",
        link: "",
        is_active: true,
      },
      {
        id: 3,
        title: "Equipamiento Completo",
        subtitle: "Turbinas, filtros de carbón, tijeras y accesorios de precisión",
        image: "assets/banner_complete_kit.jpg",
        link: "",
        is_active: true,
      },
    ];
    this.startCarousel();
  }

  private getFallbackProducts(): Product[] {
    return [
      {
        id: 1,
        name: "Sustrato Profesional Growmix Multipro 80L",
        price_retail: "28500",
        image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80",
        category_name: "Sustratos y Tierras",
        rating: 5,
        reviews_count: 32,
        stock_current: 40,
        discount_percentage: 10,
      },
      {
        id: 2,
        name: "Fertilizante Orgánico Top Crop - Top Veg 1L",
        price_retail: "18900",
        image: "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&auto=format&fit=crop&q=80",
        category_name: "Fertilizantes y Nutrientes",
        rating: 5,
        reviews_count: 24,
        stock_current: 35,
        discount_percentage: 0,
      },
      {
        id: 3,
        name: "Bioestimulante de Floración Big One Top Crop 250ml",
        price_retail: "22400",
        image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
        category_name: "Fertilizantes y Nutrientes",
        rating: 5,
        reviews_count: 41,
        stock_current: 28,
        discount_percentage: 15,
      },
      {
        id: 4,
        name: "Panel LED Quantum Board Samsung LM301H 240W",
        price_retail: "285000",
        image: "https://images.unsplash.com/photo-1508873696983-2df570464756?w=600&auto=format&fit=crop&q=80",
        category_name: "Iluminación LED",
        rating: 5,
        reviews_count: 53,
        stock_current: 12,
        discount_percentage: 12,
      },
      {
        id: 5,
        name: "Carpa de Cultivo Indoor 80x80x160cm Mylar 600D Reforzada",
        price_retail: "145000",
        image: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80",
        category_name: "Carpas e Indoor",
        rating: 5,
        reviews_count: 19,
        stock_current: 8,
        discount_percentage: 0,
      },
      {
        id: 6,
        name: "Extractor Turbina Lineal 4 Pulgadas (100mm) 220V",
        price_retail: "42000",
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
        category_name: "Ventilación y Filtros",
        rating: 4,
        reviews_count: 14,
        stock_current: 18,
        discount_percentage: 5,
      },
      {
        id: 7,
        name: "Filtro de Carbón Activado Antiolor Pro 4 Pulgadas",
        price_retail: "48500",
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
        category_name: "Ventilación y Filtros",
        rating: 5,
        reviews_count: 22,
        stock_current: 15,
        discount_percentage: 0,
      },
      {
        id: 8,
        name: "Maceta Geotextil de Tela 15 Litros con Asas Reforzadas",
        price_retail: "4200",
        image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80",
        category_name: "Macetas y Riego",
        rating: 5,
        reviews_count: 48,
        stock_current: 150,
        discount_percentage: 0,
      },
      {
        id: 9,
        name: "Medidor Digital de pH Sumergible con Calibrador Automático",
        price_retail: "18500",
        image: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&auto=format&fit=crop&q=80",
        category_name: "Control y Medición",
        rating: 4,
        reviews_count: 27,
        stock_current: 25,
        discount_percentage: 10,
      },
      {
        id: 10,
        name: "Termohigrómetro Digital con Sonda Externa Max/Min",
        price_retail: "12800",
        image: "https://images.unsplash.com/photo-1584267385494-9fdd9a71ad75?w=600&auto=format&fit=crop&q=80",
        category_name: "Control y Medición",
        rating: 5,
        reviews_count: 36,
        stock_current: 40,
        discount_percentage: 0,
      },
      {
        id: 11,
        name: "Picador Grinder Metálico 4 Partes con Tamiz Polinizador",
        price_retail: "16500",
        image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80",
        category_name: "Parafernalia y Accesorios",
        rating: 5,
        reviews_count: 62,
        stock_current: 60,
        discount_percentage: 15,
      },
      {
        id: 12,
        name: "Tijera de Poda y Manicura Curva Acero Inoxidable",
        price_retail: "8900",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
        category_name: "Parafernalia y Accesorios",
        rating: 5,
        reviews_count: 25,
        stock_current: 50,
        discount_percentage: 0,
      },
    ];
  }

  private loadAllProducts(): void {
    this.isLoading = true;
    this.api.get<Product[]>("/products/", { is_ecommerce: "true", is_active: "true" }).subscribe({
      next: (products) => {
        let rawProducts = (products as any).results || products;
        if (!rawProducts || rawProducts.length === 0) {
          rawProducts = this.getFallbackProducts();
        }

        const baseUrl = environment.apiUrl.replace(/\/api\/?$/, "");
        this.allProductsData = rawProducts.map((p: Product) => {
          if (p.image && !p.image.startsWith("http")) {
            p.image = `${baseUrl}${p.image.startsWith("/") ? "" : "/"}${p.image}`;
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
        this.isLoading = false;
        this.applyFilters();
        this.updateCartCount();
      },
      error: () => {
        this.allProductsData = this.getFallbackProducts().map((p: Product) => {
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
        this.isLoading = false;
        this.applyFilters();
        this.updateCartCount();
      }
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  applyFilters(): void {
    // Filter products from API cache
    let filtered = [...this.allProductsData];

    // Priorizar productos con stock disponible
    const inStock = filtered.filter((p) => (p.stock_current ?? 0) > 0);
    if (inStock.length > 0) {
      filtered = inStock;
    }

    if (this.selectedCategory && this.selectedCategory !== "todos") {
      const searchSlug = this.selectedCategory
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");

      filtered = filtered.filter((p) => {
        if (this.selectedCategory === "ofertas") {
          return !!(p.discount_percentage && +p.discount_percentage > 0);
        }
        if (!p.search_slug) return false;
        return p.search_slug.includes(searchSlug) || searchSlug.includes(p.search_slug);
      });
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.category_name && p.category_name.toLowerCase().includes(query)),
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
