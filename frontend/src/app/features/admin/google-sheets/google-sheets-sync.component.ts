import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { ApiService } from "src/app/core/services/api.service";
import {
  LucideAngularModule,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Upload,
  Sparkles,
  Layers,
  Store,
  Phone,
  MapPin,
  Info,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Save,
} from "lucide-angular";

@Component({
  selector: "app-google-sheets-sync",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto pb-12">
      <!-- Top Header -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <lucide-icon [name]="FileSpreadsheet" class="text-[#0f9717]" size="32"></lucide-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-black text-slate-900 tracking-tight" style="font-family: Sora, sans-serif;">
                Sincronización con Google Sheets & Excel
              </h1>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#0f9717]/10 text-[#0f9717]">
                EN VIVO
              </span>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">
              Administra precios, stock, nuevos artículos y datos de Tierra Verde Grow desde tu planilla de cálculo.
            </p>
          </div>
        </div>

        <a
          [href]="sheetUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 text-sm font-bold transition-all"
        >
          <lucide-icon [name]="ExternalLink" size="16"></lucide-icon>
          <span>Abrir Planilla en Google</span>
        </a>
      </div>

      <!-- Instructions Banner: How to grant link access in Google Drive -->
      <div class="bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 border border-amber-200/80 rounded-2xl p-5 shadow-sm">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
            <lucide-icon [name]="ShieldCheck" size="22"></lucide-icon>
          </div>
          <div class="space-y-2 text-sm text-amber-900 flex-1">
            <div class="flex items-center gap-2 font-bold text-amber-950 text-base">
              <span>Paso fundamental para conectar Google Sheets</span>
              <span class="text-xs bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-md font-semibold">Solo toma 10 segundos</span>
            </div>
            <p class="leading-relaxed">
              Google Drive mantiene los archivos privados por defecto. Para que la tienda pueda leer tus productos y precios, tu hoja de cálculo debe permitir el acceso con enlace:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div class="bg-white/80 border border-amber-200 rounded-xl p-3 text-xs flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <div>En tu Google Sheet, haz clic en el botón azul <strong class="text-amber-950">"Compartir"</strong> (arriba a la derecha).</div>
              </div>
              <div class="bg-white/80 border border-amber-200 rounded-xl p-3 text-xs flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <div>En <em>"Acceso general"</em>, cambia de "Restringido" a <strong class="text-amber-950">"Cualquier persona con el enlace"</strong>.</div>
              </div>
              <div class="bg-white/80 border border-amber-200 rounded-xl p-3 text-xs flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <div>Asegúrate que el rol sea <strong class="text-amber-950">"Lector"</strong>, haz clic en "Listo" y pulsa <strong>Sincronizar</strong> aquí abajo.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Config & Actions Card -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <label class="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2" style="font-family: Sora, sans-serif;">
            Enlace de tu Hoja de Cálculo (Google Sheets)
          </label>
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <lucide-icon [name]="FileSpreadsheet" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
              <input
                type="text"
                [(ngModel)]="sheetUrl"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-[#0f9717]/30 focus:border-[#0f9717] outline-none transition-all font-mono"
              />
            </div>
            <button
              (click)="saveUrl()"
              [disabled]="savingUrl"
              class="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <lucide-icon [name]="Save" size="16"></lucide-icon>
              <span>{{ savingUrl ? 'Guardando...' : 'Guardar Enlace' }}</span>
            </button>
          </div>
        </div>

        <!-- Sync Options -->
        <div class="flex items-center gap-3 py-2 border-y border-slate-100">
          <label class="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              [(ngModel)]="updateStoreInfo"
              class="w-4 h-4 rounded border-slate-300 text-[#0f9717] focus:ring-[#0f9717]"
            />
            <span>Sincronizar también información del negocio (si la hoja contiene WhatsApp, Dirección, Instagram o datos de cobro)</span>
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-3 pt-2">
          <button
            (click)="testPreview()"
            [disabled]="loadingPreview || loadingSync"
            class="px-6 py-3.5 rounded-xl border-2 border-[#874e04] text-[#874e04] hover:bg-[#874e04]/5 font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <lucide-icon [name]="Sparkles" size="18" [class.animate-spin]="loadingPreview"></lucide-icon>
            <span>{{ loadingPreview ? 'Analizando Planilla...' : '1. Probar Conexión & Vista Previa' }}</span>
          </button>

          <button
            (click)="runSync()"
            [disabled]="loadingPreview || loadingSync"
            class="px-7 py-3.5 rounded-xl bg-[#0f9717] hover:bg-[#0b7a12] text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <lucide-icon [name]="RefreshCw" size="18" [class.animate-spin]="loadingSync"></lucide-icon>
            <span>{{ loadingSync ? 'Sincronizando Catálogo...' : '2. Sincronizar Catálogo Ahora' }}</span>
          </button>

          <div class="sm:ml-auto">
            <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all">
              <lucide-icon [name]="Upload" size="16"></lucide-icon>
              <span>O subir archivo Excel (.xlsx / .csv)</span>
              <input type="file" accept=".xlsx,.xls,.csv" (change)="onFileSelected($event)" class="hidden" />
            </label>
          </div>
        </div>

        <!-- Status message if URL was saved -->
        <div *ngIf="urlSavedMessage" class="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
          {{ urlSavedMessage }}
        </div>
      </div>

      <!-- Access Error Alert (e.g. Private Sheet) -->
      <div *ngIf="errorMessage" class="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
            <lucide-icon [name]="AlertCircle" size="22"></lucide-icon>
          </div>
          <div class="space-y-2 flex-1">
            <h3 class="text-base font-extrabold text-rose-950">Acceso a la Hoja de Cálculo</h3>
            <div class="text-sm text-rose-900 whitespace-pre-line leading-relaxed font-medium">
              {{ errorMessage }}
            </div>
            <div class="pt-2 flex items-center gap-3">
              <a
                [href]="sheetUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm"
              >
                <lucide-icon [name]="ExternalLink" size="14"></lucide-icon>
                <span>Abrir Google Sheet para cambiar permisos</span>
              </a>
              <button
                (click)="testPreview()"
                class="px-4 py-2 rounded-xl border border-rose-300 text-rose-800 hover:bg-rose-100 text-xs font-bold"
              >
                Ya lo cambié, reintentar ahora
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Sync Banner -->
      <div *ngIf="syncSuccess" class="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl bg-[#0f9717] text-white flex items-center justify-center shrink-0 shadow-sm">
            <lucide-icon [name]="CheckCircle" size="28"></lucide-icon>
          </div>
          <div class="space-y-1.5 flex-1">
            <h3 class="text-lg font-black text-emerald-950" style="font-family: Sora, sans-serif;">
              ¡Catálogo Sincronizado Exitosamente!
            </h3>
            <p class="text-sm text-emerald-800 font-medium">
              Se procesaron un total de <strong class="text-emerald-950">{{ syncResult?.total_processed }}</strong> productos.
            </p>
            <div class="flex flex-wrap gap-2 pt-2">
              <span class="px-3 py-1 bg-white border border-emerald-200 text-emerald-900 text-xs font-bold rounded-lg shadow-sm">
                🆕 {{ syncResult?.created_count }} nuevos productos creados
              </span>
              <span class="px-3 py-1 bg-white border border-emerald-200 text-emerald-900 text-xs font-bold rounded-lg shadow-sm">
                🔄 {{ syncResult?.updated_count }} productos actualizados (precios / stock)
              </span>
              <span *ngIf="syncResult?.store_info_updated" class="px-3 py-1 bg-[#874e04]/10 border border-[#874e04]/20 text-[#874e04] text-xs font-bold rounded-lg shadow-sm">
                🏢 Datos de contacto del negocio actualizados
              </span>
            </div>
          </div>

          <a
            routerLink="/admin/products"
            class="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm shrink-0"
          >
            <span>Ver Inventario</span>
            <lucide-icon [name]="ArrowRight" size="14"></lucide-icon>
          </a>
        </div>
      </div>

      <!-- Preview Data Card -->
      <div *ngIf="previewData" class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 class="text-lg font-black text-slate-900" style="font-family: Sora, sans-serif;">
              Vista Previa de la Planilla
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Columnas y productos detectados automáticamente.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {{ previewData.summary?.to_create }} por crear
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {{ previewData.summary?.to_update }} por actualizar
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {{ previewData.summary?.total_valid }} válidos
            </span>
          </div>
        </div>

        <!-- Detected Columns Badges -->
        <div>
          <span class="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Columnas Identificadas</span>
          <div class="flex flex-wrap gap-2">
            <span
              *ngFor="let item of detectedColumnsList"
              class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-medium border border-slate-200 flex items-center gap-1.5"
            >
              <strong class="text-emerald-700 font-bold uppercase">{{ item.field }}:</strong>
              <span>"{{ item.colName }}"</span>
            </span>
          </div>
        </div>

        <!-- Detected Store Info -->
        <div *ngIf="hasStoreInfo" class="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
          <span class="text-xs font-black text-amber-900 uppercase tracking-wider block mb-2">Datos del Negocio Detectados</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div *ngIf="previewData.store_info_detected?.name" class="flex items-center gap-2 text-slate-700">
              <lucide-icon [name]="Store" size="14" class="text-amber-700"></lucide-icon>
              <span><strong>Tienda:</strong> {{ previewData.store_info_detected.name }}</span>
            </div>
            <div *ngIf="previewData.store_info_detected?.whatsapp" class="flex items-center gap-2 text-slate-700">
              <lucide-icon [name]="Phone" size="14" class="text-emerald-600"></lucide-icon>
              <span><strong>WhatsApp:</strong> {{ previewData.store_info_detected.whatsapp }}</span>
            </div>
            <div *ngIf="previewData.store_info_detected?.address" class="flex items-center gap-2 text-slate-700">
              <lucide-icon [name]="MapPin" size="14" class="text-amber-800"></lucide-icon>
              <span><strong>Local:</strong> {{ previewData.store_info_detected.address }}</span>
            </div>
            <div *ngIf="previewData.store_info_detected?.instagram" class="flex items-center gap-2 text-slate-700">
              <span><strong>Instagram:</strong> {{ previewData.store_info_detected.instagram }}</span>
            </div>
          </div>
        </div>

        <!-- Sample Products Table -->
        <div class="overflow-x-auto border border-slate-200 rounded-xl">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="p-3">Acción</th>
                <th class="p-3">SKU</th>
                <th class="p-3">Producto</th>
                <th class="p-3">Precio Venta</th>
                <th class="p-3">Stock</th>
                <th class="p-3">Categoría</th>
                <th class="p-3">Marca</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let p of previewData.sample_products" class="hover:bg-slate-50/50">
                <td class="p-3">
                  <span
                    [class]="p.action === 'Actualizar' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'"
                    class="px-2 py-0.5 rounded text-[10px] font-bold border"
                  >
                    {{ p.action }}
                  </span>
                </td>
                <td class="p-3 font-mono font-medium text-slate-600">{{ p.sku }}</td>
                <td class="p-3 font-bold text-slate-800">{{ p.name }}</td>
                <td class="p-3 font-bold text-[#0f9717]">\${{ p.price_retail | number:'1.2-2' }}</td>
                <td class="p-3 font-semibold text-slate-700">{{ p.stock_current }} u.</td>
                <td class="p-3 text-slate-600">{{ p.category }}</td>
                <td class="p-3 text-slate-500">{{ p.brand || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end pt-2">
          <button
            (click)="runSync()"
            [disabled]="loadingSync"
            class="px-6 py-3 rounded-xl bg-[#0f9717] hover:bg-[#0b7a12] text-white font-extrabold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <lucide-icon [name]="RefreshCw" size="16" [class.animate-spin]="loadingSync"></lucide-icon>
            <span>Confirmar y Sincronizar Ahora</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class GoogleSheetsSyncComponent implements OnInit {
  private api = inject(ApiService);

  sheetUrl = "https://docs.google.com/spreadsheets/d/17yIhDzBuelorQm9XrK4SMZ-uxwNzHnEX/edit?gid=699067785#gid=699067785";
  updateStoreInfo = true;

  loadingPreview = false;
  loadingSync = false;
  savingUrl = false;

  urlSavedMessage = "";
  errorMessage = "";
  syncSuccess = false;

  previewData: any = null;
  syncResult: any = null;

  // Icons
  FileSpreadsheet = FileSpreadsheet;
  RefreshCw = RefreshCw;
  CheckCircle = CheckCircle;
  ExternalLink = ExternalLink;
  Upload = Upload;
  Sparkles = Sparkles;
  Layers = Layers;
  Store = Store;
  Phone = Phone;
  MapPin = MapPin;
  Info = Info;
  AlertCircle = AlertCircle;
  ArrowRight = ArrowRight;
  ShieldCheck = ShieldCheck;
  Save = Save;

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.api.get<any>("/integrations/google-sheets/config/").subscribe({
      next: (res) => {
        if (res.sheet_url) {
          this.sheetUrl = res.sheet_url;
        }
        if (res.last_summary) {
          this.syncResult = {
            total_processed: res.last_summary.total,
            created_count: res.last_summary.created,
            updated_count: res.last_summary.updated,
            store_info_updated: res.last_summary.store_info_updated,
          };
        }
      },
      error: (err) => console.error("Error loading google sheets config", err),
    });
  }

  saveUrl() {
    this.savingUrl = true;
    this.urlSavedMessage = "";
    this.errorMessage = "";

    this.api
      .post<any>("/integrations/google-sheets/config/", {
        sheet_url: this.sheetUrl,
      })
      .subscribe({
        next: (res) => {
          this.savingUrl = false;
          this.urlSavedMessage = "¡Enlace guardado correctamente en la configuración!";
          setTimeout(() => (this.urlSavedMessage = ""), 4000);
        },
        error: (err) => {
          this.savingUrl = false;
          this.errorMessage = err.error?.error || "Error al guardar el enlace.";
        },
      });
  }

  testPreview() {
    this.loadingPreview = true;
    this.errorMessage = "";
    this.syncSuccess = false;
    this.previewData = null;

    this.api
      .post<any>("/integrations/google-sheets/preview/", {
        url: this.sheetUrl,
      })
      .subscribe({
        next: (res) => {
          this.loadingPreview = false;
          this.previewData = res;
        },
        error: (err) => {
          this.loadingPreview = false;
          this.errorMessage = err.error?.error || "No se pudo conectar con la hoja de cálculo.";
        },
      });
  }

  runSync() {
    this.loadingSync = true;
    this.errorMessage = "";
    this.syncSuccess = false;

    this.api
      .post<any>("/integrations/google-sheets/sync/", {
        url: this.sheetUrl,
        update_store_info: this.updateStoreInfo,
      })
      .subscribe({
        next: (res) => {
          this.loadingSync = false;
          this.syncSuccess = true;
          this.syncResult = res;
          this.previewData = null;
        },
        error: (err) => {
          this.loadingSync = false;
          this.errorMessage = err.error?.error || "Error durante la sincronización.";
        },
      });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files?.[0];
    if (!file) return;

    this.loadingPreview = true;
    this.errorMessage = "";
    this.previewData = null;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("action", "preview");
    formData.append("update_store_info", String(this.updateStoreInfo));

    this.api.post<any>("/integrations/google-sheets/upload/", formData).subscribe({
      next: (res) => {
        this.loadingPreview = false;
        this.previewData = res;
      },
      error: (err) => {
        this.loadingPreview = false;
        this.errorMessage = err.error?.error || "Error al procesar el archivo subido.";
      },
    });
  }

  get detectedColumnsList() {
    if (!this.previewData?.columns_detected) return [];
    return Object.entries(this.previewData.columns_detected).map(([field, colName]) => ({
      field,
      colName,
    }));
  }

  get hasStoreInfo(): boolean {
    return (
      !!this.previewData?.store_info_detected &&
      Object.keys(this.previewData.store_info_detected).length > 0
    );
  }
}
