import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import {
  LucideAngularModule,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-angular";
import { CartService } from "../../../core/services/cart.service";
import { ApiService } from "../../../core/services/api.service";

@Component({
  selector: "app-checkout-result",
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  template: `
    <div
      class="min-h-screen bg-slate-50 flex items-center justify-center p-4"
    >
      <div
        class="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center relative z-10"
      >
        <div *ngIf="status === 'success'" class="mb-8">
          <div
            class="w-24 h-24 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <lucide-icon
              [name]="CheckCircle"
              size="48"
              class="text-emerald-600"
            ></lucide-icon>
          </div>
          <h1 class="text-4xl font-black text-slate-900 mb-3 tracking-tight">
            {{ "¡Pago Exitoso!" }}
          </h1>
          <p class="text-slate-500 font-medium">
            Tu pedido ha sido procesado y el pago fue aprobado correctamente.
          </p>
        </div>

        <div *ngIf="status === 'failure'" class="mb-8">
          <div
            class="w-24 h-24 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <lucide-icon
              [name]="XCircle"
              size="48"
              class="text-red-600"
            ></lucide-icon>
          </div>
          <h1 class="text-4xl font-black text-slate-900 mb-3 tracking-tight">
            {{ "Pago Fallido" }}
          </h1>
          <p class="text-slate-500 font-medium">
            Hubo un problema al procesar tu pago. Por favor, intenta nuevamente
            en unos minutos.
          </p>
        </div>

        <div *ngIf="status === 'pending'" class="mb-8">
          <div
            class="w-24 h-24 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <lucide-icon
              [name]="Clock"
              size="48"
              class="text-amber-600"
            ></lucide-icon>
          </div>
          <h1 class="text-4xl font-black text-slate-900 mb-3 tracking-tight">
            {{ "Pago Pendiente" }}
          </h1>
          <p class="text-slate-500 font-medium">
            Tu pago está en proceso de revisión. Te enviaremos un correo apenas
            se apruebe.
          </p>
        </div>

        <!-- Summary Box -->
        <div
          class="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-10 text-left"
        >
          <div class="flex justify-between items-center text-xs mb-3">
            <span class="text-slate-500 font-bold uppercase tracking-widest"
              >Referencia de Pedido</span
            >
            <span class="text-ferre-700 font-black"
              >#{{ preferenceId?.split("-")?.[0] || "N/A" }}</span
            >
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-500 font-bold uppercase tracking-widest"
              >Estado Mercado Pago</span
            >
            <span
              class="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-black uppercase"
              >{{ mpStatus || "N/A" }}</span
            >
          </div>
        </div>

        <div
          *ngIf="status === 'pending' && paymentMethod === 'transferencia'"
          class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm mb-6"
        >
          <h4 class="font-black text-slate-900 mb-2">
            Datos para la transferencia
          </h4>
          <div class="text-slate-500">
            <div class="flex justify-between">
              <span>Titular</span
              ><span class="text-slate-900 font-bold">{{ storeInfo?.bank_titular || storeInfo?.name || 'Mi Ferreteria' }}</span>
            </div>
            <div class="flex justify-between">
              <span>CUIT</span
              ><span class="text-slate-900 font-bold">{{ storeInfo?.bank_cuit || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span>CBU</span
              ><span class="text-slate-900 font-bold">{{ storeInfo?.bank_cvu || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span>Alias</span
              ><span class="text-ferre-700 font-black">{{ storeInfo?.bank_alias || '-' }}</span>
            </div>
          </div>
          <p class="mt-3 text-slate-500 text-xs">
            Envía el comprobante por WhatsApp indicando tu referencia
            <span class="text-slate-900 font-bold">{{ preferenceId }}</span
            >. Confirmaremos la recepción y procesaremos tu pedido.
          </p>
        </div>

        <button
          routerLink="/"
          class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-3"
        >
          <span>Volver a la Tienda</span>
          <lucide-icon
            [name]="ArrowRight"
            size="20"
          ></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class CheckoutResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cartService = inject(CartService);
  private api = inject(ApiService);

  status: "success" | "failure" | "pending" = "success";
  preferenceId: string | null = null;
  mpStatus: string | null = null;
  paymentMethod: string | null = null;
  storeInfo: any = null;

  CheckCircle = CheckCircle;
  XCircle = XCircle;
  Clock = Clock;
  ArrowRight = ArrowRight;

  ngOnInit() {
    this.route.url.subscribe((url) => {
      const path = url[url.length - 1].path;
      if (path === "success") this.status = "success";
      else if (path === "failure") this.status = "failure";
      else if (path === "pending") this.status = "pending";
    });

    this.route.queryParams.subscribe((params) => {
      this.preferenceId = params["preference_id"] || null;
      this.mpStatus = params["status"] || null;
      this.paymentMethod = params["payment"] || null;

      if (this.status === "success") {
        this.cartService.clearCart().subscribe();
      }
    });

    this.api.get<any>("/tenant/info/").subscribe({
      next: (res) => this.storeInfo = res,
      error: () => {}
    });
  }
}
