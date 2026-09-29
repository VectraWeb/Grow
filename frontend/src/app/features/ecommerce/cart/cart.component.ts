import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Router } from "@angular/router";
import {
  CartService,
  CartItem,
  Cart,
} from "../../../core/services/cart.service";
import { ApiService } from "../../../core/services/api.service";
import {
  LucideAngularModule,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingCart,
} from "lucide-angular";

@Component({
  selector: "app-cart",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: "./cart.component.html",
  styleUrls: ["./cart.component.css"],
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private router = inject(Router);
  private api = inject(ApiService);

  cart: Cart | null = null;
  items: CartItem[] = [];
  total: number = 0;
  isLoading = false;
  orderPlaced = false;
  showPaymentSelector = false;
  selectedPaymentApp: string | null = null;

  Trash2 = Trash2;
  Plus = Plus;
  Minus = Minus;
  ArrowLeft = ArrowLeft;
  ShoppingCart = ShoppingCart;

  newCardOptions = [
    { id: 'mercadopago', name: 'Billetera Mercado Pago', icon: 'Ⓜ️', color: 'bg-blue-600' },
    { id: 'new_debit', name: 'Nueva tarjeta de débito', icon: '💳', color: 'bg-emerald-500' },
    { id: 'new_credit', name: 'Nueva tarjeta de crédito', icon: '💳', color: 'bg-red-500' },
    { id: 'transferencia', name: 'Transferencia Bancaria', icon: '🏦', color: 'bg-slate-500' },
  ];

  bankDetails = {
    bank: 'Banco Nación / Santander',
    owner: 'FerreNexo by VectraWeb',
    cuit: '30-12345678-9',
    alias: 'FERRE.PRO.SASA',
    cbu: '0110123456789012345678',
    whatsapp: '+5491123456789'
  };

  showBankModal = false;

  banks = [
    { name: 'Banco Nación', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Logo_Banco_Naci%C3%B3n.svg/1024px-Logo_Banco_Naci%C3%B3n.svg.png' },
    { name: 'Banco Santa Fe', logo: 'https://seeklogo.com/images/B/banco-santa-fe-logo-048E1D6A42-seeklogo.com.png' },
    { name: 'Banco Provincia', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Logo_Banco_Provincia.svg/1024px-Logo_Banco_Provincia.svg.png' },
    { name: 'Banco Hipotecario', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Logo_Banco_Hipotecario.svg/1024px-Logo_Banco_Hipotecario.svg.png' },
    { name: 'Banco Galicia', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Logo_Banco_Galicia.svg/1024px-Logo_Banco_Galicia.svg.png' }
  ];

  cards = [
    { name: 'Visa', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Visa_2014.svg/1024px-Visa_2014.svg.png' },
    { name: 'Mastercard', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1024px-Mastercard-logo.svg.png' },
    { name: 'Amex', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/1024px-American_Express_logo_%282018%29.svg.png' },
    { name: 'Cabal', logo: 'https://seeklogo.com/images/C/cabal-logo-95EFB79B7F-seeklogo.com.png' },
    { name: 'NaranjaX', logo: 'https://seeklogo.com/images/N/naranja-logo-5EFC348122-seeklogo.com.png' }
  ];

  ngOnInit(): void {
    this.cartService.cart$.subscribe((cart) => {
      this.cart = cart;
      this.items = cart?.items || [];
      this.calculateTotal();
    });
    this.cartService.loadCart();

    this.api.get<any>("/tenant/info/").subscribe({
      next: (data) => {
        if (data.whatsapp_number) {
          this.bankDetails.whatsapp = data.whatsapp_number;
        }
      },
    });
  }

  calculateTotal(): void {
    this.total = this.items.reduce((sum, item) => sum + item.total, 0);
  }

  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(item.id);
      return;
    }

    this.isLoading = true;
    this.cartService.updateQuantity(item.id, quantity).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        alert("Error al actualizar la cantidad");
      },
    });
  }

  removeItem(itemId: number): void {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      this.cartService.removeFromCart(itemId).subscribe({
        next: () => {
          alert("Producto eliminado del carrito");
        },
        error: () => {
          alert("Error al eliminar el producto");
        },
      });
    }
  }

  proceedToCheckout(): void {
    if (this.items.length === 0) {
      alert("Tu carrito está vacío");
      return;
    }
    this.router.navigate(["/checkout"]);
  }

  // Payment logic moved to standalone CheckoutComponent.

  continueShopping(): void {
    this.router.navigate(['/']);
  }

  getTax(): number {
    return 0;
  }

  getFinalTotal(): number {
    return this.total;
  }
}
