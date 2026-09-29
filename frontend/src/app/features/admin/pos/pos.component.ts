import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../../core/services/api.service";
import {
  LucideAngularModule,
  Plus,
  Trash2,
  Download,
  X,
  AlertCircle,
  Search,
  User,
  ShoppingCart,
} from "lucide-angular";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Receipt {
  id: string;
  date: string;
  customer: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

@Component({
  selector: "app-admin-pos",
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: "./pos.component.html",
  styleUrls: ["./pos.component.css"],
})
export class PosComponent implements OnInit {
  Plus = Plus;
  Trash2 = Trash2;
  Download = Download;
  X = X;
  AlertCircle = AlertCircle;
  Search = Search;
  User = User;
  ShoppingCart = ShoppingCart;

  searchTerm = "";

  api = inject(ApiService);

  currentReceipt: Receipt = {
    id: "",
    date: new Date().toLocaleDateString(),
    customer: "",
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    paymentMethod: "Efectivo",
  };

  paymentMethod = "Efectivo";
  availableProducts: any[] = [];

  receipts: Receipt[] = [];
  lastReceipt: Receipt | null = null;
  showReceiptPreview = false;

  ngOnInit(): void {
    this.loadProducts();
    this.loadReceipts();
  }

  loadProducts(): void {
    // Load products from API
    this.api.get<any>("/products/").subscribe({
      next: (response) => {
        const products = response.results || response;
        this.availableProducts = products.map((product: any) => ({
          ...product,
          price: parseInt(product.price_retail || product.price || 0, 10),
        }));
      },
      error: (err) => {
        console.error("Error loading products for POS", err);
        this.availableProducts = [];
      }
    });
  }

  getFilteredProducts(): any[] {
    if (!this.searchTerm) return this.availableProducts;
    const term = this.searchTerm.toLowerCase();
    return this.availableProducts.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.sku && p.sku.toLowerCase().includes(term))
    );
  }

  addProductToCart(product: any): void {
    const price = parseInt(product.price_retail || product.price || 0, 10);
    const existingItem = this.currentReceipt.items.find(
      (item) => item.id === product.id,
    );

    if (existingItem) {
      existingItem.quantity++;
      existingItem.total = existingItem.price * existingItem.quantity;
    } else {
      this.currentReceipt.items.push({
        id: product.id,
        name: product.name,
        price: price,
        quantity: 1,
        total: price,
      });
    }
  }

  removeFromCart(productId: number): void {
    this.currentReceipt.items = this.currentReceipt.items.filter(
      (item) => item.id !== productId,
    );
  }

  calculateSubtotal(): number {
    return this.currentReceipt.items.reduce((sum, item) => sum + item.total, 0);
  }

  calculateTax(): number {
    return Math.round(this.calculateSubtotal() * 0.21 * 100) / 100;
  }

  calculateTotal(): number {
    return this.calculateSubtotal() + this.calculateTax();
  }

  generateReceipt(): void {
    if (
      !this.currentReceipt.customer ||
      this.currentReceipt.items.length === 0
    ) {
      alert("Por favor completa los datos del cliente y agrega productos");
      return;
    }

    const receipt: Receipt = {
      ...this.currentReceipt,
      id: "REC-" + Date.now(),
      subtotal: this.calculateSubtotal(),
      tax: 0,
      total: this.calculateSubtotal(),
      paymentMethod: this.paymentMethod,
      date: new Date().toLocaleDateString(),
    };

    this.receipts.unshift(receipt);
    this.lastReceipt = receipt;
    this.showReceiptPreview = true;

    localStorage.setItem("sales_receipts", JSON.stringify(this.receipts));
    this.clearCart();
  }

  clearCart(): void {
    this.currentReceipt = {
      id: "",
      date: new Date().toLocaleDateString(),
      customer: "",
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      paymentMethod: "Efectivo",
    };
    this.paymentMethod = "Efectivo";
  }

  downloadReceipt(receipt: Receipt): void {
    this.lastReceipt = receipt;
    this.showReceiptPreview = true;
  }

  downloadReceiptPDF(): void {
    if (!this.lastReceipt) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Remito ${this.lastReceipt.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 10px; }
          .header h1 { margin: 0; font-size: 24px; }
          .info { margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          table th, table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          table th { background-color: #f5f5f5; font-weight: bold; }
          .totals { margin-top: 20px; text-align: right; }
          .totals p { margin: 5px 0; font-size: 14px; }
          .total-amount { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FerreNexo</h1>
          <p>Remito de Venta</p>
        </div>
        
        <div class="info">
          <p><strong>Remito #:</strong> ${this.lastReceipt.id}</p>
          <p><strong>Fecha:</strong> ${this.lastReceipt.date}</p>
          <p><strong>Cliente:</strong> ${this.lastReceipt.customer}</p>
          <p><strong>Método de Pago:</strong> ${this.lastReceipt.paymentMethod}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${this.lastReceipt.items
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${item.total.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <p><strong>Subtotal:</strong> $${this.lastReceipt.subtotal.toFixed(2)}</p>
          <p class="total-amount"><strong>TOTAL A PAGAR: $${this.lastReceipt.total.toFixed(2)}</strong></p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Remito_${this.lastReceipt.id}.html`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  loadReceipts(): void {
    const saved = localStorage.getItem("sales_receipts");
    if (saved) {
      this.receipts = JSON.parse(saved);
    }
  }

  clearReceiptHistory(): void {
    if (
      confirm(
        "¿Estás seguro de que deseas limpiar el historial de remitos? Esta acción no se puede deshacer.",
      )
    ) {
      this.receipts = [];
      localStorage.removeItem("sales_receipts");
      this.lastReceipt = null;
    }
  }
}
