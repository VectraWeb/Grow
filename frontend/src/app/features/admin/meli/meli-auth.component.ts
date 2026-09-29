import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { ApiService } from "src/app/core/services/api.service";
import { LucideAngularModule, Zap, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Unplug } from "lucide-angular";

@Component({
  selector: "app-meli-auth",
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-2xl mx-auto py-12">
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-8 relative overflow-hidden">
        <div class="relative z-10 space-y-8">

          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-lg bg-ferre-50 border border-ferre-200 flex items-center justify-center flex-shrink-0">
              <lucide-icon [name]="Zap" size="28" class="text-amber-600"></lucide-icon>
            </div>
            <div>
              <h1 class="text-2xl font-extrabold text-slate-900 uppercase tracking-wider" style="font-family: Sora, sans-serif;">Mercado Libre</h1>
              <p class="text-slate-500 text-sm">Sincroniza tu catalogo y recibi pedidos automaticamente</p>
            </div>
          </div>

          <div *ngIf="isLoading" class="flex items-center justify-center py-12 gap-3">
            <div class="w-5 h-5 border-2 border-slate-200 border-t-amber-600 rounded-full animate-spin"></div>
            <span class="text-slate-500 font-medium">Verificando estado...</span>
          </div>

          <div *ngIf="successMessage" class="rounded-lg p-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200">
            <lucide-icon [name]="CheckCircle2" size="20" class="text-emerald-600"></lucide-icon>
            <span class="text-emerald-700 text-sm font-medium">{{ successMessage }}</span>
          </div>

          <div *ngIf="errorMessage" class="rounded-lg p-4 flex items-center gap-3 bg-red-50 border border-red-200">
            <lucide-icon [name]="AlertCircle" size="20" class="text-red-600"></lucide-icon>
            <span class="text-red-700 text-sm font-medium">{{ errorMessage }}</span>
          </div>

          <div *ngIf="isExchanging" class="flex items-center justify-center py-12 gap-3">
            <div class="w-5 h-5 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <span class="text-slate-500 font-medium">Vinculando tu cuenta...</span>
          </div>

          <div *ngIf="!isLoading && !isExchanging && isLinked" class="space-y-6">
            <div class="rounded-lg p-6 flex items-start gap-4 bg-emerald-50 border border-emerald-200">
              <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <lucide-icon [name]="CheckCircle2" size="20" class="text-emerald-600"></lucide-icon>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-slate-900 uppercase tracking-wider" style="font-family: Sora, sans-serif;">Cuenta conectada</h3>
                <p class="text-emerald-700 text-sm mt-1">Tu cuenta de Mercado Libre esta vinculada y activa. Los productos marcados para sincronizar se publican automaticamente.</p>
                <div *ngIf="account" class="mt-3 flex flex-wrap gap-3">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    {{ account.nickname || account.email || 'Vinculada' }}
                  </span>
                  <a *ngIf="account.link" [href]="account.link" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-colors">
                    <lucide-icon [name]="ExternalLink" size="12"></lucide-icon>
                    Ver perfil en MeLi
                  </a>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="bg-white rounded-lg p-4 text-center border border-slate-200">
                <div class="text-2xl font-extrabold text-slate-900" style="font-family: Sora, sans-serif;">&#10003;</div>
                <div class="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wider">Publicaciones automaticas</div>
              </div>
              <div class="bg-white rounded-lg p-4 text-center border border-slate-200">
                <div class="text-2xl font-extrabold text-slate-900" style="font-family: Sora, sans-serif;">&#10003;</div>
                <div class="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wider">Sync de precios y stock</div>
              </div>
              <div class="bg-white rounded-lg p-4 text-center border border-slate-200">
                <div class="text-2xl font-extrabold text-slate-900" style="font-family: Sora, sans-serif;">&#10003;</div>
                <div class="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wider">Pedidos integrados</div>
              </div>
            </div>

            <div class="flex gap-3">
              <button (click)="linkAccount()" class="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition-all">
                <lucide-icon [name]="RefreshCw" size="16"></lucide-icon>
                Reconectar cuenta
              </button>
              <button (click)="disconnect()" class="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold transition-all">
                <lucide-icon [name]="Unplug" size="16"></lucide-icon>
                Desconectar
              </button>
              <a href="https://www.mercadolibre.com.ar/ventas" target="_blank" class="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-ferre-50 hover:bg-ferre-100 border border-ferre-200 text-ferre-700 text-sm font-bold transition-all">
                <lucide-icon [name]="ExternalLink" size="16"></lucide-icon>
                Ver mis ventas en MeLi
              </a>
            </div>
          </div>

          <div *ngIf="!isLoading && !isExchanging && !isLinked" class="space-y-6">
            <div class="bg-white border border-slate-200 rounded-lg p-6">
              <h3 class="text-base font-bold text-slate-900 mb-4 uppercase tracking-wider" style="font-family: Sora, sans-serif;">Que podes hacer al conectar?</h3>
              <ul class="space-y-3">
                <li class="flex items-center gap-3 text-sm text-slate-600">
                  <span class="w-5 h-5 rounded-full bg-ferre-50 border border-ferre-200 flex items-center justify-center text-ferre-700 text-[10px] font-bold flex-shrink-0">1</span>
                  Publicar productos automaticamente en Mercado Libre desde el formulario del producto
                </li>
                <li class="flex items-center gap-3 text-sm text-slate-600">
                  <span class="w-5 h-5 rounded-full bg-ferre-50 border border-ferre-200 flex items-center justify-center text-ferre-700 text-[10px] font-bold flex-shrink-0">2</span>
                  Sincronizar precios y stock en tiempo real sin entrar a Mercado Libre
                </li>
                <li class="flex items-center gap-3 text-sm text-slate-600">
                  <span class="w-5 h-5 rounded-full bg-ferre-50 border border-ferre-200 flex items-center justify-center text-ferre-700 text-[10px] font-bold flex-shrink-0">3</span>
                  Recibir notificaciones de nuevos pedidos directamente en el panel
                </li>
              </ul>
            </div>

            <div class="p-5 space-y-3 bg-ferre-50 border border-ferre-200 rounded-lg">
              <div class="flex items-start gap-3">
                <lucide-icon [name]="AlertCircle" size="20" class="text-amber-600 shrink-0 mt-0.5"></lucide-icon>
                <div>
                  <h4 class="text-[11px] font-bold text-slate-900 uppercase tracking-wider" style="font-family: Sora, sans-serif;">Vincular tu cuenta propia de vendedor?</h4>
                  <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                    Asegurate de iniciar sesion con la cuenta de <strong>tu negocio o ferreteria</strong> en Mercado Libre. Si tenes abierta tu cuenta personal en este navegador, cerrala antes de continuar.
                  </p>
                </div>
              </div>
              <div class="flex gap-2 pt-2 border-t border-slate-200">
                <a href="https://www.mercadolibre.com.ar/jms/ml/lgout" target="_blank" class="flex-1 text-center py-2 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                  Cerrar sesion actual en MeLi
                </a>
              </div>
            </div>

            <button
              (click)="linkAccount()"
              [disabled]="isExchanging"
              class="w-full bg-ferre-500 hover:bg-amber-400 text-white py-3.5 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-3 group disabled:opacity-50 uppercase tracking-wider"
            >
              <lucide-icon [name]="Zap" size="20" class="group-hover:rotate-12 transition-transform"></lucide-icon>
              Conectar con Mercado Libre
            </button>

            <p class="text-center text-xs text-slate-500">
              Seras redirigido a Mercado Libre para autorizar el acceso. Es seguro y podes revocar el permiso en cualquier momento.
            </p>
          </div>

        </div>
      </div>
    </div>
  `
})
export class MeliAuthComponent implements OnInit {
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  Zap = Zap;
  CheckCircle2 = CheckCircle2;
  AlertCircle = AlertCircle;
  RefreshCw = RefreshCw;
  ExternalLink = ExternalLink;
  Unplug = Unplug;

  isLoading = true;
  isLinked = false;
  isExchanging = false;
  authUrl = '';
  account: any = null;

  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['meli'] === 'success') {
        this.successMessage = 'Cuenta vinculada exitosamente';
        this.router.navigate([], { queryParams: { meli: null }, queryParamsHandling: 'merge' });
        setTimeout(() => this.successMessage = '', 5000);
        this.checkStatus();
      } else if (params['error']) {
        this.isLoading = false;
        this.errorMessage = 'Error al vincular: ' + params['error'];
        this.router.navigate([], { queryParams: { error: null }, queryParamsHandling: 'merge' });
        setTimeout(() => this.errorMessage = '', 5000);
      } else {
        this.checkStatus();
      }
    });
  }

  checkStatus() {
    this.isLoading = true;
    this.api.get<any>('/integrations/meli/auth-url/').subscribe({
      next: (res) => {
        this.isLinked = res.is_linked;
        this.authUrl = res.auth_url;
        this.account = res.account || null;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  linkAccount() {
    if (this.authUrl && this.authUrl !== '#error-no-config') {
      window.location.href = this.authUrl;
    } else {
      this.isLoading = true;
      this.api.get<any>('/integrations/meli/auth-url/').subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.auth_url && res.auth_url !== '#error-no-config') {
            window.location.href = res.auth_url;
          } else {
            alert('Error: Las credenciales MELI_CLIENT_ID o MELI_REDIRECT_URI no están bien configuradas en el .env del servidor master.');
          }
        },
        error: () => {
          this.isLoading = false;
          alert('Error de comunicación con el backend al generar la URL.');
        }
      });
    }
  }

  exchangeCode(code: string) {
    this.api.post<any>('/integrations/meli/authorize/', { code }).subscribe({
      next: () => {
        this.isExchanging = false;
        this.isLinked = true;
        this.router.navigate([], { queryParams: { code: null }, queryParamsHandling: 'merge' });
      },
      error: (err) => {
        this.isExchanging = false;
        alert('Error al vincular cuenta: ' + (err.error?.error || 'Intenta de nuevo'));
        this.router.navigate(['/admin/meli']);
      }
    });
  }

  disconnect() {
    if (!confirm('Seguro que queres desconectar la cuenta de Mercado Libre?')) return;
    this.api.post<any>('/integrations/meli/disconnect/', {}).subscribe({
      next: () => {
        this.isLinked = false;
        this.account = null;
        this.successMessage = '';
      },
      error: (err) => {
        alert('Error al desconectar: ' + (err.status || 'desconocido'));
      }
    });
  }
}
