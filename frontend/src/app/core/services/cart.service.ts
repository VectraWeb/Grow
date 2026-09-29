import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ApiService } from "./api.service";

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  image: string;
  total: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  time?: string;
}

export interface Cart {
  id: number;
  session_id: string;
  items: CartItem[];
  total: number;
  shipping_cost?: number;
  zip_code?: string;
  shipping_methods?: ShippingMethod[];
  selected_shipping_id?: string;
}

@Injectable({
  providedIn: "root",
})
export class CartService {
  private api = inject(ApiService);
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  private drawerOpenSubject = new BehaviorSubject<boolean>(false);
  public drawerOpen$ = this.drawerOpenSubject.asObservable();

  private sessionId: string = "";
  private cartItems: CartItem[] = [];
  private nextItemId: number = 1;
  private shippingCost: number = 0;
  private selectedZip: string = "";
  private shippingMethods: ShippingMethod[] = [];
  private selectedShippingId: string = "";

  constructor() {
    this.initializeSession();
    this.loadCartFromLocalStorage();
  }

  private initializeSession(): void {
    this.sessionId =
      localStorage.getItem("cart_session_id") || this.generateSessionId();
  }

  private generateSessionId(): string {
    const id = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("cart_session_id", id);
    return id;
  }

  private loadCartFromLocalStorage(): void {
    try {
      const savedCart = localStorage.getItem("cart_items");
      const savedNextId = localStorage.getItem("cart_next_id");
      if (savedCart) {
        this.cartItems = JSON.parse(savedCart);
        this.nextItemId = savedNextId ? parseInt(savedNextId, 10) : 1;
        this.updateCartSubject();
      } else {
        this.saveCartToLocalStorage();
      }
    } catch (error) {
      console.error("Error loading cart from localStorage", error);
      this.cartItems = [];
    }
  }

  private saveCartToLocalStorage(): void {
    localStorage.setItem("cart_items", JSON.stringify(this.cartItems));
    localStorage.setItem("cart_next_id", this.nextItemId.toString());
  }

  private updateCartSubject(): void {
    const total = this.cartItems.reduce((sum, item) => sum + item.total, 0);
    this.cartSubject.next({
      id: 1,
      session_id: this.sessionId,
      items: [...this.cartItems],
      total,
      shipping_cost: this.shippingCost,
      zip_code: this.selectedZip,
      shipping_methods: this.shippingMethods,
      selected_shipping_id: this.selectedShippingId,
    });
  }

  loadCart(): void {
    this.loadCartFromLocalStorage();
  }

  addToCart(
    productId: number,
    quantity: number = 1,
    productName: string = "",
    price: string = "0",
    image: string = "",
  ): Observable<Cart> {
    return new Observable((observer) => {
      try {
        const existingItem = this.cartItems.find(
          (item) => item.product_id === productId,
        );

        if (existingItem) {
          existingItem.quantity += quantity;
          existingItem.total = existingItem.quantity * existingItem.price;
        } else {
          // Normalize image URL before saving to cart
          let imageUrl = image;
          if (imageUrl && !imageUrl.startsWith("http")) {
            imageUrl = `http://127.0.0.1:8000${imageUrl}`;
          }

          const newItem: CartItem = {
            id: this.nextItemId++,
            product_id: productId,
            product_name: productName || `Producto ${productId}`,
            quantity,
            price: parseFloat(price) || 0,
            image: imageUrl,
            total: quantity * (parseFloat(price) || 0),
          };
          this.cartItems.push(newItem);
        }

        this.saveCartToLocalStorage();
        this.updateCartSubject();

        observer.next(this.cartSubject.value!);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  removeFromCart(itemId: number): Observable<Cart> {
    return new Observable((observer) => {
      try {
        this.cartItems = this.cartItems.filter((item) => item.id !== itemId);
        this.saveCartToLocalStorage();
        this.updateCartSubject();

        observer.next(this.cartSubject.value!);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  updateQuantity(itemId: number, quantity: number): Observable<Cart> {
    return new Observable((observer) => {
      try {
        const item = this.cartItems.find((i) => i.id === itemId);
        if (item) {
          item.quantity = quantity;
          item.total = quantity * item.price;
          this.saveCartToLocalStorage();
          this.updateCartSubject();
        }

        observer.next(this.cartSubject.value!);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  calculateShipping(zipCode: string): Observable<any> {
    this.selectedZip = zipCode;
    
    if (this.cartItems.length === 0) return new Observable(o => o.next({}));

    const firstItem = this.cartItems[0];
    return this.api.post<any>(`/products/${firstItem.product_id}/calculate_shipping/`, { zip_code: zipCode }).pipe(
      map(res => {
        const methods: ShippingMethod[] = [
          { id: 'pickup', name: 'Retiro en Sucursal', price: 0, time: 'Inmediato' }
        ];

        if (res && res.rates && Array.isArray(res.rates)) {
          // Buscamos la tarifa de tipo 'D' (Domicilio)
          const homeDelivery = res.rates.find((r: any) => r.deliveredType === 'D');
          if (homeDelivery) {
            methods.push({ 
              id: 'standard', 
              name: 'Envío a Domicilio (Correo Arg)', 
              price: parseFloat(homeDelivery.price),
              time: '3 a 5 días hábiles'
            });
          }
        }

        this.shippingMethods = methods;
        if (!this.selectedShippingId) {
          this.selectShippingMethod('pickup');
        } else {
          this.updateCartSubject();
        }
        return res;
      })
    );
  }

  selectShippingMethod(methodId: string): void {
    this.selectedShippingId = methodId;
    const method = this.shippingMethods.find(m => m.id === methodId);
    this.shippingCost = method ? method.price : 0;
    this.updateCartSubject();
  }

  clearCart(): Observable<any> {
    return new Observable((observer) => {
      try {
        this.cartItems = [];
        this.nextItemId = 1;
        this.saveCartToLocalStorage();
        this.cartSubject.next(null);

        observer.next(null);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  getCartTotal(): number {
    const cart = this.cartSubject.value;
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.total, 0);
  }

  getCartItemCount(): number {
    const cart = this.cartSubject.value;
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  private getCartId(): string {
    const cart = this.cartSubject.value;
    return cart ? cart.id.toString() : "";
  }

  getSessionId(): string {
    return this.sessionId;
  }

  createMercadoPagoPreference(): Observable<any> {
    const items = this.cartItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }));
    return this.api.post("/integrations/mercadopago/preference/", { items });
  }

  createCheckout(formData: any, paymentMethod: string): Observable<any> {
    const items = this.cartItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }));
    const payload = { ...formData, name: `${formData.firstName} ${formData.lastName}`.trim() };
    return this.api.post("/ecommerce/checkout/", { 
      items, 
      formData: payload, 
      paymentMethod,
      shippingCost: this.shippingCost 
    });
  }

  openDrawer(): void {
    this.drawerOpenSubject.next(true);
  }

  closeDrawer(): void {
    this.drawerOpenSubject.next(false);
  }

  toggleDrawer(): void {
    this.drawerOpenSubject.next(!this.drawerOpenSubject.value);
  }
}
