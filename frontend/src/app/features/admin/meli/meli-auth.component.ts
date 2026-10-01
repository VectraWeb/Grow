import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ApiService } from "src/app/core/services/api.service";
import {
  LucideAngularModule,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Unplug,
  Key,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-angular";

@Component({
  selector: "app-meli-auth",
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10 relative overflow-hidden">
        <div class="relative z-10 space-y-8">

          <!-- Header -->
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0 shadow-sm">
              <lucide-icon [name]="Zap" size="28" class="text-amber-600"></lucide-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-black text-slate-900 tracking-tight" style="font-family: Sora, sans-serif;">Mercado Libre</h1>
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                      [ngClass]="isLinked ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'">
                  <span class="w-2 h-2 rounded-full" [ngClass]="isLinked ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></span>
                  {{ isLinked ? 'Conectado' : 'No conectado' }}
                </span>
              </div>
              <p class="text-slate-500 text-sm mt-0.5">Publica automáticamente los productos que subes y sincroniza stock y precios</p>
            </div>
          </div>

          <!-- Spinner Carga -->
          <div *ngIf="isLoading" class="flex items-center justify-center py-12 gap-3">
            <div class="w-5 h-5 border-2 border-slate-200 border-t-amber-600 rounded-full animate-spin"></div>
            <span class="text-slate-500 font-medium">Verificando estado de vinculación...</span>
          </div>

          <!-- Mensajes de Éxito / Error -->
          <div *ngIf="successMessage" class="rounded-xl p-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200">
            <lucide-icon [name]="CheckCircle2" size="20" class="text-emerald-600"></lucide-icon>
            <span class="text-emerald-700 text-sm font-medium">{{ successMessage }}</span>
          </div>

          <div *ngIf="errorMessage" class="rounded-xl p-4 flex items-center gap-3 bg-red-50 border border-red-200">
            <lucide-icon [name]="AlertCircle" size="20" class="text-red-600"></lucide-icon>
            <span class="text-red-700 text-sm font-medium">{{ errorMessage }}</span>
          </div>

          <!-- Estado 1: CUENTA VINCULADA -->
          <div *ngIf="!isLoading && isLinked" class="space-y-6">
            <div class="rounded-2xl p-6 bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <lucide-icon [name]="CheckCircle2" size="20" class="text-emerald-600"></lucide-icon>
              </div>
              <div class="flex-1">
                <h3 class="text-base font-bold text-slate-900" style="font-family: Sora, sans-serif;">Cuenta de Vendedor Conectada</h3>
                <p class="text-emerald-700 text-xs sm:text-sm mt-1">
                  Tu tienda está sincronizada con Mercado Libre. Cada producto nuevo o editado se publicará automáticamente si tiene stock disponible.
                </p>
                <div *ngIf="account" class="mt-3 flex flex-wrap gap-2.5 items-center">
                  <span class="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    {{ account.nickname || account.email || 'Vendedor Autorizado' }}
                  </span>
                  <a *ngIf="account.link" [href]="account.link" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm">
                    <lucide-icon [name]="ExternalLink" size="12"></lucide-icon>
                    Ver perfil oficial en Mercado Libre
                  </a>
                </div>
              </div>
            </div>

            <!-- Features Activas -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
                <div class="w-8 h-8 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center font-bold text-sm mb-1.5">✓</div>
                <div class="text-xs text-slate-900 font-bold uppercase tracking-wider">Publicación Automática</div>
                <div class="text-[11px] text-slate-500 mt-1">Al crear producto en tu catálogo</div>
              </div>
              <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
                <div class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center font-bold text-sm mb-1.5">✓</div>
                <div class="text-xs text-slate-900 font-bold uppercase tracking-wider">Sync Stock & Precios</div>
                <div class="text-[11px] text-slate-500 mt-1">Actualización inmediata en MeLi</div>
              </div>
              <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
                <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center font-bold text-sm mb-1.5">✓</div>
                <div class="text-xs text-slate-900 font-bold uppercase tracking-wider">Categoría Inteligente</div>
                <div class="text-[11px] text-slate-500 mt-1">Predicción MLA por IA</div>
              </div>
            </div>

            <!-- Botones de Acción -->
            <div class="flex flex-wrap gap-3 pt-2">
              <button (click)="linkAccount()" class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm">
                <lucide-icon [name]="RefreshCw" size="14"></lucide-icon>
                Reconectar cuenta
              </button>
              <button (click)="disconnect()" class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all shadow-sm">
                <lucide-icon [name]="Unplug" size="14"></lucide-icon>
                Desconectar
              </button>
              <a href="https://www.mercadolibre.com.ar/ventas" target="_blank" class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all shadow-sm">
                <lucide-icon [name]="ExternalLink" size="14"></lucide-icon>
                Mis publicaciones en MeLi
              </a>
            </div>
          </div>

          <!-- Estado 2: CUENTA NO VINCULADA -->
          <div *ngIf="!isLoading && !isLinked" class="space-y-6">

            <!-- Beneficios -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 class="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider" style="font-family: Sora, sans-serif;">
                ¿Qué sucederá al conectar tu cuenta?
              </h3>
              <ul class="space-y-3">
                <li class="flex items-center gap-3 text-xs sm:text-sm text-slate-600">
                  <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs flex-shrink-0">1</span>
                  Cada producto nuevo que crees en la web se publicará automáticamente en tu cuenta de Mercado Libre.
                </li>
                <li class="flex items-center gap-3 text-xs sm:text-sm text-slate-600">
                  <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs flex-shrink-0">2</span>
                  Al modificar stock o precio en el sistema, se actualizará en tiempo real en Mercado Libre.
                </li>
                <li class="flex items-center gap-3 text-xs sm:text-sm text-slate-600">
                  <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs flex-shrink-0">3</span>
                  Se auto-clasificará el producto en la categoría correcta de Mercado Libre Argentina.
                </li>
              </ul>
            </div>

            <!-- Botón Conectar Principal -->
            <button
              (click)="linkAccount()"
              [disabled]="isExchanging"
              class="w-full bg-[#FFE600] hover:bg-[#F2DB00] text-[#2D3277] py-4 rounded-xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 uppercase tracking-wider group"
            >
              <lucide-icon [name]="Zap" size="20" class="group-hover:rotate-12 transition-transform text-[#2D3277]"></lucide-icon>
              Conectar con Mercado Libre (1 Click)
            </button>

            <!-- Card Acordeón: Configuración de Credenciales de Desarrollador (Client ID & Secret) -->
            <div class="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              <button
                type="button"
                (click)="showConfigForm = !showConfigForm"
                class="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/60 transition-colors"
              >
                <div class="flex items-center gap-2.5">
                  <lucide-icon [name]="Key" size="18" class="text-slate-500"></lucide-icon>
                  <span class="text-xs sm:text-sm font-bold text-slate-700">
                    Configurar App ID y Client Secret de Mercado Libre
                  </span>
                </div>
                <lucide-icon [name]="showConfigForm ? ChevronUp : ChevronDown" size="18" class="text-slate-400"></lucide-icon>
              </button>

              <div *ngIf="showConfigForm" class="p-6 border-t border-slate-200 bg-white space-y-4">
                <p class="text-xs text-slate-500 leading-relaxed">
                  Ingresa las credenciales de tu aplicación creada en 
                  <a href="https://developers.mercadolibre.com.ar/devcenter" target="_blank" class="text-amber-600 underline font-semibold">Mercado Libre Developers</a>. 
                  La URL de redirección debe configurarse como: 
                  <code class="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[11px]">{{ currentRedirectUri }}</code>
                </p>

                <div *ngIf="configSuccess" class="rounded-lg p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold">
                  {{ configSuccess }}
                </div>
                <div *ngIf="configError" class="rounded-lg p-3 bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                  {{ configError }}
                </div>

                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Client ID / App ID
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="clientId"
                      placeholder="Ej: 1234567890123456"
                      class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Client Secret / Secret Key
                    </label>
                    <input
                      type="password"
                      [(ngModel)]="clientSecret"
                      placeholder="Ej: aBcD1234eFgh5678..."
                      class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div class="flex justify-end pt-2">
                  <button
                    type="button"
                    (click)="saveConfig()"
                    [disabled]="isSavingConfig || !clientId || !clientSecret"
                    class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    {{ isSavingConfig ? 'Guardando...' : 'Guardar Credenciales' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Aviso de sesión -->
            <div class="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
              <lucide-icon [name]="AlertCircle" size="18" class="text-amber-600 shrink-0 mt-0.5"></lucide-icon>
              <div class="text-xs text-slate-600 leading-relaxed">
                Asegúrate de tener abierta la cuenta de <strong>tu negocio / growshop</strong> en Mercado Libre en este navegador al momento de autorizar.
              </div>
            </div>

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
  Key = Key;
  ChevronDown = ChevronDown;
  ChevronUp = ChevronUp;
  HelpCircle = HelpCircle;

  isLoading = true;
  isLinked = false;
  isExchanging = false;
  authUrl = '';
  account: any = null;

  showConfigForm = false;
  clientId = '';
  clientSecret = '';
  isSavingConfig = false;
  configSuccess = '';
  configError = '';
  currentRedirectUri = window.location.origin + '/admin/meli';

  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.loadConfig();
    this.route.queryParams.subscribe(params => {
      if (params['meli'] === 'success') {
        this.successMessage = '¡Cuenta de Mercado Libre vinculada exitosamente!';
        this.router.navigate([], { queryParams: { meli: null }, queryParamsHandling: 'merge' });
        setTimeout(() => this.successMessage = '', 6000);
        this.checkStatus();
      } else if (params['error']) {
        this.isLoading = false;
        this.errorMessage = 'Error al vincular: ' + params['error'];
        this.router.navigate([], { queryParams: { error: null }, queryParamsHandling: 'merge' });
        setTimeout(() => this.errorMessage = '', 6000);
      } else {
        this.checkStatus();
      }
    });
  }

  loadConfig() {
    this.api.get<any>('/integrations/meli/config/').subscribe({
      next: (res) => {
        if (res.client_id) this.clientId = res.client_id;
        if (res.client_secret) this.clientSecret = res.client_secret;
      },
      error: () => {}
    });
  }

  saveConfig() {
    this.isSavingConfig = true;
    this.configSuccess = '';
    this.configError = '';

    this.api.post<any>('/integrations/meli/config/', {
      client_id: this.clientId,
      client_secret: this.clientSecret
    }).subscribe({
      next: () => {
        this.isSavingConfig = false;
        this.configSuccess = '¡Credenciales guardadas correctamente! Ahora puedes conectar tu cuenta.';
        this.checkStatus();
        setTimeout(() => this.configSuccess = '', 5000);
      },
      error: (err) => {
        this.isSavingConfig = false;
        this.configError = err.error?.error || 'Error al guardar las credenciales.';
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
        if (!this.isLinked && (!res.auth_url || res.auth_url === '#error-no-config')) {
          this.showConfigForm = true;
        }
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
      this.showConfigForm = true;
      alert('Por favor ingresa primero tu Client ID y Client Secret de Mercado Libre en el formulario de configuración.');
    }
  }

  disconnect() {
    if (!confirm('¿Estás seguro de que deseas desconectar la cuenta de Mercado Libre?')) return;
    this.api.post<any>('/integrations/meli/disconnect/', {}).subscribe({
      next: () => {
        this.isLinked = false;
        this.account = null;
        this.successMessage = 'Cuenta desconectada exitosamente';
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        alert('Error al desconectar: ' + (err.status || 'desconocido'));
      }
    });
  }
}
