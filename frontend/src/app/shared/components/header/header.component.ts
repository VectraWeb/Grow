import { Component, OnInit, inject, Input, Output, EventEmitter, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Router } from "@angular/router";
import { CartService } from "../../../core/services/cart.service";
import { NavigationService } from "../../../core/services/navigation.service";
import { CategoriesService } from "../../../core/services/categories.service";
import {
  LucideAngularModule,
  ShoppingCart,
  User,
  Search,
  Sprout
} from "lucide-angular";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, FormsModule],
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
})
export class HeaderComponent implements OnInit {
  private cartService = inject(CartService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private categoriesService = inject(CategoriesService);

  @Input() searchable = true;
  @Output() search = new EventEmitter<string>();
  @Output() categoryChange = new EventEmitter<string>();

  cartCount = 0;
  isSearchExpanded = false;
  searchQuery = "";
  isScrolled = false;

  ShoppingCart = ShoppingCart;
  User = User;
  Search = Search;
  Sprout = Sprout;

  activeDropdown: string | null = null;
  mobileMenuOpen = false;
  categories: any[] = [];
  categoriesLoading = true;

  ngOnInit(): void {
    this.cartService.cart$.subscribe(() => {
      this.cartCount = this.cartService.getCartItemCount();
    });
    this.cartService.loadCart();
    
    // Una sola fuente de categorías (servicio con caché compartida).
    // categoriesLoading distingue "cargando" de "vacío" para no mostrar
    // "Cargando..." eternamente cuando no hay categorías.
    this.categoriesService.loadCategories().subscribe({
      next: (data: any) => {
        this.categories = (data as any).results || data || [];
        this.categoriesLoading = false;
      },
      error: () => {
        this.categories = [];
        this.categoriesLoading = false;
      }
    });

    // Close search on click outside
    document.addEventListener("click", (event: any) => {
      const searchContainer = document.querySelector("[data-search-container]");
      if (searchContainer && !searchContainer.contains(event.target)) {
        this.closeSearch();
      }
    });
  }

  toggleSearchExpanded(): void {
    if (!this.searchable) {
       this.router.navigate(['/'], { queryParams: { search: this.searchQuery } });
       return;
    }
    this.isSearchExpanded = !this.isSearchExpanded;
  }

  closeSearch(): void {
    this.isSearchExpanded = false;
  }

  onSearchChange(): void {
    this.navigationService.setSearchQuery(this.searchQuery);
    this.search.emit(this.searchQuery);
  }

  openCart(): void {
    this.cartService.openDrawer();
  }

  filterByCategory(category: string): void {
    this.navigationService.setCategory(category);
    if (this.router.url.split('?')[0] !== '/' && this.router.url.split('?')[0] !== '/ecommerce/home') {
        this.router.navigate(['/']);
    } else {
        this.categoryChange.emit(category);
        window.scrollTo({ top: 0, behavior: "smooth" }); // scroll to top when category changes
    }
  }

  scrollToCalculator(): void {
    if (this.router.url.split('?')[0] !== '/' && this.router.url.split('?')[0] !== '/ecommerce/home') {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          this.scrollToCalcElement();
        }, 500);
      });
    } else {
      this.scrollToCalcElement();
    }
  }

  private scrollToCalcElement(): void {
    const calcElement = document.getElementById("material-calculator-section");
    if (calcElement) {
      const y = calcElement.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }
}

