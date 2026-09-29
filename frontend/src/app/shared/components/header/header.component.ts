import { Component, OnInit, inject, Input, Output, EventEmitter, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Router } from "@angular/router";
import { CartService } from "../../../core/services/cart.service";
import { NavigationService } from "../../../core/services/navigation.service";
import { ApiService } from "../../../core/services/api.service";
import {
  LucideAngularModule,
  ShoppingCart,
  User,
  Search,
  Hammer
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
  private api = inject(ApiService);

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
  Hammer = Hammer;

  activeDropdown: string | null = null;
  mobileMenuOpen = false;
  categories: any[] = [];

  ngOnInit(): void {
    this.cartService.cart$.subscribe(() => {
      this.cartCount = this.cartService.getCartItemCount();
    });
    this.cartService.loadCart();
    
    // Fetch categories dynamically (already ordered by display_order in backend API)
    this.api.get<any>("/categories/").subscribe({
      next: (res) => {
        const data = res.results || res;
        this.categories = data;
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

