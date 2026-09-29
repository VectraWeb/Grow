import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CartService } from "../../../core/services/cart.service";
import { 
  LucideAngularModule, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Ticket,
  ChevronRight,
  Truck
} from "lucide-angular";
import { RouterModule, Router } from "@angular/router";

import { NavigationService } from "../../../core/services/navigation.service";

@Component({
  selector: "app-cart-drawer",
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, FormsModule],
  templateUrl: "./cart-drawer.component.html",
  styleUrls: ["./cart-drawer.component.css"],
})
export class CartDrawerComponent {
  public cartService = inject(CartService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  
  X = X;
  Plus = Plus;
  Minus = Minus;
  Trash2 = Trash2;
  ShoppingCart = ShoppingCart;
  ArrowRight = ArrowRight;
  ShieldCheck = ShieldCheck;
  CreditCard = CreditCard;
  Ticket = Ticket;
  ChevronRight = ChevronRight;
  Truck = Truck;
  
  zipCode = "";
  isCalculatingShipping = false;
  shippingError = "";

  isOpen$ = this.cartService.drawerOpen$;
  cart$ = this.cartService.cart$;

  close(): void {
    this.cartService.closeDrawer();
  }

  updateQuantity(itemId: number, quantity: number): void {
    if (quantity < 1) return;
    this.cartService.updateQuantity(itemId, quantity).subscribe();
  }

  removeItem(itemId: number): void {
    this.cartService.removeFromCart(itemId).subscribe();
  }

  checkout(): void {
    this.close();
    this.router.navigate(['/checkout']);
  }

  updateShipping(): void {
    if (!this.zipCode || this.zipCode.length < 4) {
      this.shippingError = "Ingresa un código postal válido";
      return;
    }
    this.isCalculatingShipping = true;
    this.shippingError = "";
    this.cartService.calculateShipping(this.zipCode).subscribe({
      next: () => {
        this.isCalculatingShipping = false;
      },
      error: (err) => {
        this.isCalculatingShipping = false;
        this.shippingError = "No se pudo calcular el envío";
      }
    });
  }

  getFinalTotal(cart: any): number {
    return cart.total + (cart.shipping_cost || 0);
  }

  selectShipping(id: string): void {
    this.cartService.selectShippingMethod(id);
  }

  exploreCatalog(): void {
    this.navigationService.setCategory('todos');
    this.close();
    this.router.navigate(['/'], { fragment: 'catalog' });
  }
}
