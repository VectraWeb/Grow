import { Component, OnInit, inject } from "@angular/core";
import { ApiService } from "../../../core/services/api.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { CartService, CartItem } from "../../../core/services/cart.service";
import {
  LucideAngularModule,
  ArrowLeft,
  CheckCircle2,
  Mail,
  User,
  MapPin,
  CreditCard,
  Building2,
  Phone,
  Check,
  Loader2,
} from "lucide-angular";

@Component({
  selector: "app-checkout",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 pt-28 pb-16">
      <div class="w-full max-w-5xl mx-auto px-4">
        <div class="mb-6">
          <button
            (click)="goBack()"
            class="flex items-center gap-2 text-slate-400 hover:text-ferre-400 font-semibold text-sm transition-colors group"
          >
            <lucide-icon [name]="ArrowLeft" size="18" class="group-hover:-translate-x-1 transition-transform"></lucide-icon>
            Volver al Carrito
          </button>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="md:col-span-2 space-y-5">
            <!-- Step Progress -->
            <div class="flex items-center justify-between max-w-lg mx-auto mb-8">
              <div class="relative flex flex-col items-center">
                <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all"
                  [ngClass]="currentStep === 1 ? 'bg-ferre-400 text-slate-800' : 'bg-ferre-50 text-ferre-400'">
                  <lucide-icon *ngIf="currentStep > 1" [name]="Check" size="16" strokeWidth="3"></lucide-icon>
                  <span *ngIf="currentStep <= 1">1</span>
                </div>
                <span class="mt-2 text-xs font-semibold" [ngClass]="currentStep >= 1 ? 'text-ferre-700' : 'text-slate-400'">Contacto</span>
              </div>
              <div class="flex-1 h-0.5 mx-4 rounded-full transition-all" [ngClass]="currentStep >= 2 ? 'bg-ferre-400' : 'bg-slate-200'"></div>
              <div class="relative flex flex-col items-center">
                <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all"
                  [ngClass]="currentStep === 2 ? 'bg-ferre-400 text-slate-800' : currentStep > 2 ? 'bg-ferre-50 text-ferre-400' : 'bg-slate-200 text-slate-500'">
                  <lucide-icon *ngIf="currentStep > 2" [name]="Check" size="16" strokeWidth="3"></lucide-icon>
                  <span *ngIf="currentStep <= 2">2</span>
                </div>
                <span class="mt-2 text-xs font-semibold" [ngClass]="currentStep >= 2 ? 'text-ferre-700' : 'text-slate-400'">Envio</span>
              </div>
              <div class="flex-1 h-0.5 mx-4 rounded-full transition-all" [ngClass]="currentStep >= 3 ? 'bg-ferre-400' : 'bg-slate-200'"></div>
              <div class="relative flex flex-col items-center">
                <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all"
                  [ngClass]="currentStep === 3 ? 'bg-ferre-400 text-slate-800' : 'bg-slate-200 text-slate-500'">
                  3
                </div>
                <span class="mt-2 text-xs font-semibold" [ngClass]="currentStep >= 3 ? 'text-ferre-700' : 'text-slate-400'">Pago</span>
              </div>
            </div>

            <!-- Step 1: Contacto -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" [class.hidden]="currentStep !== 1">
              <h2 class="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <lucide-icon [name]="Mail" class="text-ferre-700" size="20"></lucide-icon>
                Datos de Contacto
              </h2>
              <div class="space-y-4">
                <div>
                  <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Correo Electronico</label>
                  <input type="email" [(ngModel)]="formData.email" placeholder="ejemplo@correo.com"
                    class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm" />
                </div>
                <div class="bg-ferre-50 border border-ferre-200 rounded-xl p-3 flex gap-3 text-sm text-slate-600">
                  <lucide-icon [name]="Check" size="18" class="text-ferre-700 flex-shrink-0 mt-0.5" strokeWidth="3"></lucide-icon>
                  <p>Puedes comprar sin cuenta. Usaremos tu email solo para enviarte el comprobante y seguimiento del pedido.</p>
                </div>
                <p *ngIf="formData.email && !isValidEmail(formData.email)" class="text-red-500 text-xs font-medium">Ingresa un email valido (gmail.com, hotmail.com, outlook.com, yahoo.com)</p>
                <button (click)="nextStep()" [disabled]="!formData.email || !isValidEmail(formData.email)"
                  class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-3 rounded-lg shadow-sm transition-all disabled:opacity-50 text-sm">
                  Continuar
                </button>
              </div>
            </div>

            <!-- Step 2: Envio / Facturacion -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" [class.hidden]="currentStep !== 2">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <lucide-icon [name]="User" class="text-ferre-700" size="20"></lucide-icon>
                  Datos de Facturacion
                </h2>
                <button (click)="setStep(1)" class="text-xs font-semibold text-slate-500 hover:text-ferre-400 transition-colors">Cambiar Email</button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Nombre</label>
                  <input type="text" [(ngModel)]="formData.firstName" placeholder="Nombre" class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Apellido</label>
                  <input type="text" [(ngModel)]="formData.lastName" placeholder="Apellido" class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">DNI</label>
                  <input type="text" [(ngModel)]="formData.cuit" placeholder="Sin puntos ni guiones" maxlength="8" class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm" />
                  <p *ngIf="formData.cuit && !isValidDNI(formData.cuit)" class="text-red-500 text-xs font-medium mt-1">El DNI debe tener 8 digitos</p>
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Telefono</label>
                  <input type="tel" [(ngModel)]="formData.phone" placeholder="Ej: 1122334455" maxlength="10" class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm" />
                  <p *ngIf="formData.phone && !isValidPhone(formData.phone)" class="text-red-500 text-xs font-medium mt-1">El telefono debe tener entre 8 y 10 digitos</p>
                </div>

                <div class="md:col-span-2 mt-2 pt-4 border-t border-slate-200">
                  <h3 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <lucide-icon [name]="MapPin" size="16" class="text-ferre-700"></lucide-icon>
                    Donde enviamos
                  </h3>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="col-span-2 relative">
                      <div class="relative">
                        <input type="text" [(ngModel)]="formData.address" (input)="onAddressInput()" placeholder="Busca tu calle, luego agrega el numero" class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm pr-10" />
                        <div *ngIf="isSearchingAddress" class="absolute right-3 top-1/2 -translate-y-1/2">
                          <lucide-icon [name]="Loader2" size="16" class="animate-spin text-ferre-400"></lucide-icon>
                        </div>
                      </div>
                      <div *ngIf="addressSuggestions.length > 0" class="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                        <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                          <span>Resultados</span>
                          <span class="text-ferre-400">No aparece? Agrega la ciudad</span>
                        </div>
                        <button *ngFor="let suggestion of addressSuggestions" (click)="selectSuggestion(suggestion)"
                          class="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                          <span class="text-sm font-semibold text-slate-700">{{ formatAddressTitle(suggestion) }}</span>
                          <span class="text-xs text-slate-500 block mt-0.5">{{ formatAddressSubtitle(suggestion) }}</span>
                        </button>
                        <div class="p-2 text-center">
                          <button (click)="addressSuggestions = []" class="text-[10px] font-bold text-slate-500 hover:text-slate-700 uppercase">Cerrar</button>
                        </div>
                      </div>
                    </div>
                    <div class="col-span-2">
                      <input type="text" [(ngModel)]="formData.notes" placeholder="Depto, timbre, o indicaciones (Opcional)" class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm" />
                    </div>
                    <input type="text" [(ngModel)]="formData.city" placeholder="Ciudad" class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm" />
                    <input type="text" [(ngModel)]="formData.province" placeholder="Provincia" class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm" />
                    <div class="col-span-2">
                      <input type="text" [(ngModel)]="formData.zip" placeholder="Codigo Postal" class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <label class="flex items-start gap-3 mt-6 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div class="relative flex items-center justify-center mt-0.5 w-5 h-5">
                  <input type="checkbox" [(ngModel)]="formData.saveData" class="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" />
                  <div *ngIf="!formData.saveData" class="w-4.5 h-4.5 border-2 border-slate-300 rounded transition-colors pointer-events-none relative z-10" style="width:18px;height:18px;"></div>
                  <lucide-icon *ngIf="formData.saveData" [name]="CheckCircle2" size="20" class="text-ferre-700 pointer-events-none relative z-10" strokeWidth="2"></lucide-icon>
                </div>
                <div>
                  <span class="block text-sm font-semibold text-slate-700 mb-0.5">Guardar mis datos y crear una cuenta</span>
                  <span class="block text-xs text-slate-500">Crea una cuenta rapidamente para ver tu historial y acelerar tu proxima compra.</span>
                </div>
              </label>

              <button (click)="nextStep()" [disabled]="!formData.firstName || !formData.lastName || !isValidDNI(formData.cuit) || !isValidPhone(formData.phone) || !formData.address"
                class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-3 rounded-lg shadow-sm transition-all mt-5 disabled:opacity-50 text-sm">
                Continuar al Pago
              </button>
            </div>

            <!-- Step 3: Pago -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" [class.hidden]="currentStep !== 3">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <lucide-icon [name]="CreditCard" class="text-ferre-700" size="20"></lucide-icon>
                  Medio de Pago
                </h2>
                <button (click)="setStep(2)" class="text-xs font-semibold text-slate-500 hover:text-ferre-400 transition-colors">Cambiar Datos</button>
              </div>

              <div class="space-y-3">
                <div *ngIf="tenantInfo?.has_mp" (click)="selectPayment('mercadopago')"
                  class="p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4"
                  [ngClass]="paymentMethod === 'mercadopago' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'">
                  <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">M</div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-slate-900 text-sm">Mercado Pago</h3>
                    <p class="text-xs text-slate-500">Tarjetas de credito, debito y dinero en cuenta</p>
                  </div>
                  <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center" [ngClass]="paymentMethod === 'mercadopago' ? 'border-blue-500' : 'border-slate-300'">
                    <div class="w-2.5 h-2.5 rounded-full bg-blue-500" *ngIf="paymentMethod === 'mercadopago'"></div>
                  </div>
                </div>

                <div *ngIf="tenantInfo?.bank_cvu || tenantInfo?.bank_alias" (click)="selectPayment('transferencia')"
                  class="p-4 rounded-xl border cursor-pointer transition-all flex flex-col"
                  [ngClass]="paymentMethod === 'transferencia' ? 'border-ferre-400 bg-ferre-50' : 'border-slate-200 bg-white hover:border-slate-300'">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 text-lg font-bold">B</div>
                    <div class="flex-1">
                      <h3 class="font-semibold text-slate-900 text-sm">Transferencia Bancaria</h3>

                    </div>
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center" [ngClass]="paymentMethod === 'transferencia' ? 'border-ferre-400' : 'border-slate-300'">
                      <div class="w-2.5 h-2.5 rounded-full bg-ferre-400 transition-all scale-0" [class.scale-100]="paymentMethod === 'transferencia'"></div>
                    </div>
                  </div>
                  <div *ngIf="paymentMethod === 'transferencia'" class="mt-4 pt-4 border-t border-slate-200 text-sm">
                    <p class="text-slate-600 font-medium mb-3">Transfiere el monto exacto a la siguiente cuenta:</p>
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div class="flex justify-between items-center">
                        <span class="text-slate-500 text-xs">Titular</span>
                        <span class="text-slate-900 font-semibold text-sm">{{ tenantInfo?.bank_titular || tenantInfo?.name || '...' }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-slate-500 text-xs">CUIT</span>
                        <span class="text-slate-900 font-semibold text-sm">{{ tenantInfo?.bank_cuit || '...' }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-slate-500 text-xs">CBU / CVU</span>
                        <span class="text-slate-900 font-semibold text-sm">{{ tenantInfo?.bank_cvu || '...' }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-slate-500 text-xs">Alias</span>
                        <span class="text-ferre-700 font-bold text-sm">{{ tenantInfo?.bank_alias || '...' }}</span>
                      </div>
                    </div>
                    <p class="mt-3 text-xs text-slate-500">
                      Una vez finalizado, <span class="text-ferre-700 font-semibold">envia el comprobante</span> por WhatsApp indicando tu codigo de pedido.
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-3 mt-6">
                <button (click)="processPayment()" [disabled]="!paymentMethod || isProcessing"
                  class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-3.5 rounded-lg shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                  <lucide-icon *ngIf="isProcessing" [name]="Loader2" size="20" class="animate-spin"></lucide-icon>
                  <span *ngIf="paymentMethod === 'transferencia'">{{ isProcessing ? 'Procesando...' : 'YA REALICE LA TRANSFERENCIA' }}</span>
                  <span *ngIf="paymentMethod !== 'transferencia' && paymentMethod !== ''">{{ isProcessing ? 'Procesando...' : 'PAGAR $' + (getFinalTotal() | number:'1.0-0') }}</span>
                  <span *ngIf="paymentMethod === '' && (tenantInfo?.has_mp || tenantInfo?.bank_cvu)">SELECCIONAR PAGO</span>
                  <span *ngIf="!tenantInfo?.has_mp && !tenantInfo?.bank_cvu && !tenantInfo?.bank_alias" class="text-sm">NINGUN MEDIO DE PAGO DISPONIBLE</span>
                </button>
                <button *ngIf="paymentMethod === 'transferencia' && !isProcessing" (click)="goHome()"
                  class="w-full bg-white border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-all text-sm">
                  VOLVER AL INICIO
                </button>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
          <div>
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-24">
              <h3 class="font-bold text-slate-900 mb-4 text-sm">Resumen</h3>
              <div class="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-1">
                <div *ngFor="let item of items" class="flex gap-3">
                  <div class="w-11 h-11 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                    <img *ngIf="item.image" [src]="item.image" class="w-full h-full object-contain" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-slate-700 truncate">{{ item.product_name }}</p>
                    <p class="text-[11px] text-slate-500">{{ item.quantity }} x \${{ item.price | number:'1.0-0' }}</p>
                  </div>
                </div>
              </div>
              <div class="border-t border-slate-200 pt-3 space-y-2 mt-3">
                <div class="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span>\${{ total | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between text-base text-slate-900 font-bold pt-2 border-t border-slate-200 mt-2">
                  <span>Total</span>
                  <span class="text-ferre-700">\${{ getFinalTotal() | number:'1.0-0' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CheckoutComponent implements OnInit {
  private cartService = inject(CartService);
  private router = inject(Router);
  private api = inject(ApiService);

  currentStep = 1;
  items: CartItem[] = [];
  total = 0;
  isProcessing = false;
  tenantInfo: any = null;

  formData = {
    email: "",
    firstName: "",
    lastName: "",
    cuit: "",
    phone: "",
    address: "",
    notes: "",
    city: "",
    province: "",
    zip: "",
    saveData: true,
  };

  addressSuggestions: any[] = [];
  isSearchingAddress = false;
  private searchTimeout: any;

  paymentMethod: string = "";

  ArrowLeft = ArrowLeft;
  Mail = Mail;
  User = User;
  MapPin = MapPin;
  CreditCard = CreditCard;
  Building2 = Building2;
  Phone = Phone;
  Check = Check;
  CheckCircle2 = CheckCircle2;
  Loader2 = Loader2;

  private purchaseCompleted = false;

  ngOnInit() {
    this.cartService.cart$.subscribe((cart) => {
      this.items = cart?.items || [];
      this.calculateTotal();

      if (
        this.items.length === 0 &&
        !this.isProcessing &&
        !this.purchaseCompleted
      ) {
        this.router.navigate(["/cart"]);
      }
    });
    this.cartService.loadCart();
    
    this.api.get<any>('/tenant/info/').subscribe({
      next: (data) => {
        this.tenantInfo = data;
      },
      error: (err) => {
        console.error('Error fetching tenant payments config', err);
      }
    });
  }

  calculateTotal(): void {
    this.total = this.items.reduce((sum, item) => sum + item.total, 0);
  }

  getTax(): number {
    return Math.round(this.total * 0.21);
  }

  getFinalTotal(): number {
    return this.total;
  }

  goBack() {
    this.router.navigate(["/"]).then(() => {
      setTimeout(() => this.cartService.openDrawer(), 300);
    });
  }

  goHome() {
    this.router.navigate(["/"]);
  }

  setStep(step: number) {
    this.currentStep = step;
  }

  nextStep() {
    if (this.currentStep < 3) this.currentStep++;
  }

  isValidEmail(email: string): boolean {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    const allowed = ['gmail.com','hotmail.com','outlook.com','yahoo.com','live.com.ar','live.com','icloud.com','protonmail.com','proton.me','aol.com','mail.com','zoho.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return allowed.includes(domain);
  }

  isValidDNI(dni: string): boolean {
    return /^\d{7,8}$/.test(dni);
  }

  isValidPhone(phone: string): boolean {
    return /^\d{8,10}$/.test(phone);
  }

  selectPayment(method: string) {
    this.paymentMethod = method;
  }

  processPayment() {
    this.isProcessing = true;

    if (this.formData.saveData) {
      console.log("Account to be created for:", this.formData.email);
    }

    if (this.paymentMethod === "mercadopago") {
      this.cartService.createMercadoPagoPreference().subscribe({
        next: (res) => {
          if (res.init_point) window.location.href = res.init_point;
        },
        error: () => {
          alert("Error creando pago");
          this.isProcessing = false;
        },
      });
    } else {
      this.cartService
        .createCheckout(this.formData, this.paymentMethod)
        .subscribe({
          next: (res) => {
            this.purchaseCompleted = true;
            const reference =
              res?.order_reference || res?.reference || res?.id || null;
            this.cartService.clearCart().subscribe(() => {
              this.isProcessing = false;
              this.router.navigate(["/checkout/pending"], {
                queryParams: {
                  preference_id: reference,
                  payment: this.paymentMethod,
                },
              });
            });
          },
          error: (err) => {
            console.error("Error creating checkout:", err);
            this.isProcessing = false;
          },
        });
    }
  }

  onAddressInput() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    const query = this.formData.address;
    if (query.length < 5) {
      this.addressSuggestions = [];
      return;
    }

    this.isSearchingAddress = true;
    this.searchTimeout = setTimeout(() => {
      const viewbox = "-63,-36,-58,-31";
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ar&viewbox=${viewbox}&addressdetails=1&limit=10`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          this.addressSuggestions = data.map((item: any) => ({
            display_name: item.display_name,
            address: item.address,
            title: this.getSmartTitle(item),
            subtitle: this.getSmartSubtitle(item),
          }));
          this.isSearchingAddress = false;
        })
        .catch((err) => {
          console.error("Error fetching addresses:", err);
          this.isSearchingAddress = false;
        });
    }, 600);
  }

  private getSmartTitle(item: any): string {
    const addr = item.address;
    const street =
      addr.road || addr.pedestrian || addr.cycleway || addr.suburb || "";
    const number = addr.house_number || "";

    if (street) {
      return `${street} ${number}`.trim();
    }

    const parts = item.display_name.split(",");
    if (parts[0].length < 5 && parts.length > 1) {
      return `${parts[0].trim()}, ${parts[1].trim()}`;
    }
    return parts[0].trim();
  }

  private getSmartSubtitle(item: any): string {
    const parts = item.display_name.split(",");
    const title = this.getSmartTitle(item);
    return parts
      .filter((p: string) => !title.includes(p.trim()))
      .slice(0, 3)
      .join(", ")
      .trim();
  }

  selectSuggestion(suggestion: any) {
    const addr = suggestion.address;

    this.formData.address = this.getSmartTitle(suggestion);

    this.formData.city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.suburb ||
      "";
    this.formData.province = addr.state || "";
    this.formData.zip = addr.postcode || "";

    this.addressSuggestions = [];
  }

  formatAddressTitle(suggestion: any): string {
    return suggestion.title;
  }

  formatAddressSubtitle(suggestion: any): string {
    return suggestion.subtitle;
  }
}

declare var google: any;
