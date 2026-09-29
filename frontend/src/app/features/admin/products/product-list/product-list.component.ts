import { Component, OnInit, inject, ViewEncapsulation } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "src/app/core/services/api.service";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import {
  LucideAngularModule,
  Plus,
  Search,
  Edit3,
  Trash2,
  PackageSearch,
  Globe,
  RefreshCw,
} from "lucide-angular";
import { RouterModule, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { MarketplacePublishComponent } from "../marketplace-publish/marketplace-publish.component";

@Component({
  selector: "app-product-list",
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    LucideAngularModule,
    RouterModule,
    FormsModule,
    MarketplacePublishComponent,
  ],
  styles: [`
    @media (max-width: 768px) {
      .header-area {
        padding: 0.75rem !important;
      }
      .header-area .flex.items-center.justify-between {
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .header-area .flex.items-center.gap-4 {
        gap: 0.5rem !important;
      }
      .header-area .w-14.h-14 {
        width: 2rem !important;
        height: 2rem !important;
      }
      .header-area h1 {
        font-size: 1rem !important;
      }
      .header-area .max-w-md {
        order: 3;
        width: 100% !important;
        max-width: 100% !important;
      }
      .header-area .max-w-md input {
        padding-left: 3rem !important;
        padding-right: 0.75rem !important;
        padding-top: 0.5rem !important;
        padding-bottom: 0.5rem !important;
        font-size: 0.75rem !important;
      }
      .header-area .max-w-md lucide-icon {
        left: 0.75rem !important;
        size: 12px !important;
      }
      .header-area > :last-child {
        order: 2;
        margin-left: auto;
      }
      .header-area .btn-add {
        padding: 0.5rem 0.75rem !important;
        font-size: 0.7rem !important;
      }
      .header-area .btn-add span {
        display: none;
      }
      :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
        padding: 0.3rem 0.2rem !important;
        font-size: 0.45rem !important;
        letter-spacing: 0.02em !important;
      }
      :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
        padding: 0.3rem 0.15rem !important;
      }
      :host ::ng-deep .p-datatable .hide-mobile {
        display: none !important;
      }
      :host ::ng-deep .p-datatable .show-mobile-only {
        display: inline !important;
      }
      :host ::ng-deep .p-datatable .p-datatable-tbody td .mobile-actions {
        display: flex !important;
        gap: 0.15rem !important;
        align-items: center !important;
        justify-content: center !important;
        flex-wrap: nowrap !important;
      }
      :host ::ng-deep .p-datatable .p-datatable-tbody td .mobile-actions app-marketplace-publish {
        flex-shrink: 0 !important;
      }
      :host ::ng-deep .p-datatable .p-datatable-tbody td .mobile-actions app-marketplace-publish .dropdown {
        position: static !important;
      }
      :host ::ng-deep .p-datatable .p-datatable-tbody td .mobile-actions app-marketplace-publish .action-btn {
        padding: 0.15rem !important;
        min-width: 1.5rem !important;
        width: 1.5rem !important;
        height: 1.5rem !important;
        font-size: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 0 !important;
      }
      :host ::ng-deep .p-datatable .p-datatable-tbody td .mobile-actions app-marketplace-publish .action-btn > span,
      :host ::ng-deep .p-datatable .p-datatable-tbody td .mobile-actions app-marketplace-publish .action-btn > lucide-icon + span {
        display: none !important;
      }
      :host ::ng-deep .p-datatable .p-datatable-tbody td .mobile-actions app-marketplace-publish .dropdown-menu {
        position: fixed !important;
        left: 5vw !important;
        right: 5vw !important;
        width: auto !important;
        min-width: auto !important;
        max-width: 90vw !important;
      }
      :host ::ng-deep .p-datatable .p-datatable-tbody td .mobile-actions .action-icon {
        width: 1.5rem !important;
        height: 1.5rem !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 0.375rem !important;
        border: none !important;
        cursor: pointer !important;
        flex-shrink: 0 !important;
        text-decoration: none !important;
      }
      :host ::ng-deep .p-datatable .p-datatable-tbody td .mobile-actions .action-icon lucide-icon {
        margin: 0 !important;
      }
      :host ::ng-deep .p-datatable .p-paginator {
        padding: 0.5rem !important;
      }
      :host ::ng-deep .p-datatable .p-paginator .p-paginator-pages .p-paginator-page {
        min-width: 2rem !important;
        height: 2rem !important;
        font-size: 0.7rem !important;
      }
    }

    :host ::ng-deep .p-datatable-dark.p-datatable {
      background: transparent !important;
    }

    .show-mobile-only {
      display: none !important;
    }
    
    :host ::ng-deep .p-datatable-dark .p-datatable-wrapper {
      background: transparent !important;
    }

    :host ::ng-deep .p-datatable-dark .p-datatable-thead > tr > th {
      background: #f8fafc !important;
      color: #64748b !important;
      border-bottom: 2px solid #e2e8f0 !important;
      padding: 0.5rem 0.75rem !important;
      font-size: 0.65rem !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.06em !important;
      white-space: nowrap !important;
    }

    :host ::ng-deep .p-sort-icon {
      display: inline-block !important;
      vertical-align: middle !important;
      margin-left: 0.15rem !important;
    }

    :host ::ng-deep .p-datatable-dark .p-datatable-tbody > tr {
      background: transparent !important;
      color: #0f172a !important;
      transition: all 0.15s !important;
    }

    :host ::ng-deep .p-datatable-dark .p-datatable-tbody > tr:hover {
      background: rgba(0,0,0,0.02) !important;
    }

    :host ::ng-deep .p-datatable-dark .p-datatable-tbody > tr > td {
      border-bottom: 1px solid #e2e8f0 !important;
      padding: 1rem 1.25rem !important;
      background: transparent !important;
    }

    :host ::ng-deep .p-datatable-dark .p-paginator {
      background: #f8fafc !important;
      border: none !important;
      border-top: 2px solid #e2e8f0 !important;
      color: #64748b !important;
      padding: 1rem !important;
    }

    :host ::ng-deep .p-datatable-dark .p-paginator .p-paginator-pages .p-paginator-page {
      color: #64748b !important;
      background: transparent !important;
      border: 1.5px solid #e2e8f0 !important;
      border-radius: 0.375rem !important;
      min-width: 2.25rem !important;
      height: 2.25rem !important;
      margin: 0 0.25rem !important;
      transition: all 0.2s !important;
      font-weight: 700 !important;
    }

    :host ::ng-deep .p-datatable-dark .p-paginator .p-paginator-pages .p-paginator-page:hover {
      background: rgba(166, 154, 120, 0.06) !important;
      border-color: #c2b69a !important;
      color: #a67000 !important;
    }

    :host ::ng-deep .p-datatable-dark .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
      background: #c2b69a !important;
      color: #1e293b !important;
      border-color: #c2b69a !important;
      font-weight: 800 !important;
    }

    :host ::ng-deep .p-datatable-dark .p-paginator .p-link {
      color: #64748b !important;
    }

    :host ::ng-deep .p-datatable-dark .p-paginator .p-paginator-current {
      color: #64748b !important;
      font-size: 0.75rem !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
    }
  `],
  template: `
    <div class="h-full flex flex-col space-y-6">
      <!-- Header Area -->
      <div class="header-area bg-white border border-slate-200 rounded-xl shadow-sm p-6 relative">
        <div class="flex items-center justify-between gap-6">
          <!-- Left: Branding & Info -->
          <div class="flex items-center gap-4 shrink-0">
            <div class="w-14 h-14 rounded-2xl bg-ferre-50 flex items-center justify-center border border-slate-200 shrink-0">
              <lucide-icon
                [name]="PackageSearch"
                class="text-ferre-700"
                size="32"
              ></lucide-icon>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight" style="font-family: Sora, sans-serif;">Inventario</h1>
              </div>
              <p class="text-slate-500 font-medium text-sm">
                <span class="text-slate-900 font-bold opacity-80">{{ products.length }}</span> productos activos en total.
              </p>
            </div>
          </div>

          <!-- Center: Search -->
          <div class="relative z-10 w-full max-w-md">
            <div class="relative group/search">
              <lucide-icon [name]="Search" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-ferre-400 transition-colors"></lucide-icon>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearch()"
                placeholder="Buscar producto o SKU..."
                class="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 text-slate-900 rounded-2xl focus:ring-2 focus:ring-ferre-400/30 focus:border-ferre-400 transition-all placeholder-slate-400 outline-none shadow-sm"
              />
            </div>
          </div>

          <!-- Right: Actions -->
          <div class="relative z-10 flex items-center gap-3 shrink-0">
            <button
              routerLink="new"
              class="btn-add bg-ferre-400 hover:bg-ferre-500 text-slate-800 px-6 py-3.5 rounded-2xl font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 group/plus"
            >
              <lucide-icon [name]="Plus" size="20" class="group-hover/plus:rotate-90 transition-transform"></lucide-icon>
              <span>Agregar Producto</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table Area -->
      <div
        class="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm"
      >
        <p-table
          [value]="products"
          [paginator]="true"
          [rows]="10"
          [loading]="loading"
          paginatorTemplate="PrevPageLink PageLinks NextPageLink CurrentPageReport"
          currentPageReportTemplate="Mostrando {totalRecords} productos"
          styleClass="p-datatable-dark custom-table"
        >
          <ng-template pTemplate="header">
            <tr class="bg-slate-50">
              <th class="px-2 py-2 font-extrabold text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200 w-10 text-center" style="font-family: Sora, sans-serif;">IMG</th>
              <th pSortableColumn="name" class="px-2 py-2 font-extrabold text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200 cursor-pointer" style="font-family: Sora, sans-serif;">
                <div class="inline-flex items-center gap-1">Producto <p-sortIcon field="name"></p-sortIcon></div>
              </th>
              <th pSortableColumn="sku" class="hide-mobile px-2 py-2 font-extrabold text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200 cursor-pointer" style="font-family: Sora, sans-serif;">
                <div class="inline-flex items-center gap-1">SKU <p-sortIcon field="sku"></p-sortIcon></div>
              </th>
              <th pSortableColumn="price_retail" class="px-2 py-2 font-extrabold text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200 cursor-pointer" style="font-family: Sora, sans-serif;">
                <div class="inline-flex items-center gap-1">Precio <p-sortIcon field="price_retail"></p-sortIcon></div>
              </th>
              <th pSortableColumn="stock_current" class="px-2 py-2 font-extrabold text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200 cursor-pointer" style="font-family: Sora, sans-serif;">
                <div class="inline-flex items-center gap-1">Stock <p-sortIcon field="stock_current"></p-sortIcon></div>
              </th>
              <th class="px-2 py-2 font-extrabold text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200 text-center" style="font-family: Sora, sans-serif;">Acciones</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-product>
            <tr class="group border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-1 py-2">
                <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                  <img
                    *ngIf="product.image"
                    [src]="product.image"
                    [alt]="product.name"
                    class="w-full h-full object-cover"
                  />
                  <lucide-icon
                    *ngIf="!product.image"
                    [name]="PackageSearch"
                    class="text-slate-400"
                    size="14"
                  ></lucide-icon>
                </div>
              </td>
              <td class="px-2 py-2">
                <span class="font-bold text-slate-900 text-xs group-hover:text-ferre-400 transition-colors whitespace-nowrap overflow-hidden text-ellipsis block max-w-[120px]">{{ product.name }}</span>
              </td>
              <td class="hide-mobile px-6 py-4 text-slate-500 font-mono text-xs uppercase tracking-tighter">
                {{ product.sku }}
              </td>
              <td class="px-2 py-2">
                <span class="font-extrabold text-ferre-700 text-xs whitespace-nowrap" style="font-family: Sora, sans-serif;">$ {{ product.price_retail | number: "1.0-0" }}</span>
              </td>
              <td class="px-2 py-2">
                <span
                  class="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border whitespace-nowrap"
                  [ngClass]="{
                    'bg-red-50 text-red-600 border-red-200': product.stock_current <= 5,
                    'bg-emerald-50 text-emerald-700 border-emerald-200': product.stock_current > 5
                  }"
                >
                  {{ product.stock_current }}
                </span>
              </td>
              <td class="px-1 py-2 text-center">
                <div class="flex items-center justify-center gap-1">
                  <app-marketplace-publish [productId]="product.id"></app-marketplace-publish>
                  <a
                    [routerLink]="['/admin/products', product.id, 'edit']"
                    class="action-icon bg-slate-100 hover:bg-slate-200 text-slate-500"
                    title="Editar"
                  >
                    <lucide-icon [name]="Edit3" size="13"></lucide-icon>
                  </a>
                  <button
                    (click)="deleteProduct(product)"
                    class="action-icon bg-red-50 hover:bg-red-100 text-red-600"
                    title="Eliminar"
                  >
                    <lucide-icon [name]="Trash2" size="13"></lucide-icon>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center py-24">
                <div class="flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <div class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                    <lucide-icon [name]="PackageSearch" size="40" class="opacity-30 text-slate-400"></lucide-icon>
                  </div>
                  <p class="text-xl font-extrabold uppercase tracking-widest text-slate-600" style="font-family: Sora, sans-serif;">Sin coincidencias</p>
                  <p class="text-sm font-medium opacity-60">Intenta con otra descripcion o codigo de barras.</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class ProductListComponent implements OnInit {
  api = inject(ApiService);
  router = inject(Router);
  products: any[] = [];
  loading = true;
  searchQuery = "";
  searchTimeout: any;

  Plus = Plus;
  Search = Search;
  Edit3 = Edit3;
  Trash2 = Trash2;
  PackageSearch = PackageSearch;
  Globe = Globe;
  RefreshCw = RefreshCw;

  isSyncing = false;

  ngOnInit() {
    console.log("ProductListComponent initialized");
    this.loadProducts();
    this.checkMeLiStatus();
  }

  checkMeLiStatus() {
    this.api.get<any>("/integrations/meli/auth-url/").subscribe({
      next: (res) => console.log("MeLi Linked Status:", res.is_linked),
      error: (err) => console.error("Error checking MeLi status in init", err)
    });
  }

  loadProducts() {
    this.loading = true;

    this.api.get("/products/").subscribe(
      (response: any) => {
        const rawProducts = response.results || response;

        this.products = rawProducts.map((p: any) => {
          if (p.image && !p.image.startsWith("http")) {
            p.image = `http://127.0.0.1:8000${p.image}`;
          }
          return p;
        });

        this.loading = false;
      },
      (error) => {
        console.error("Error loading products", error);
        this.products = [];
        this.loading = false;
      },
    );
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loading = true;

      const params = this.searchQuery ? { search: this.searchQuery } : {};
      this.api.get("/products/", params).subscribe(
        (response: any) => {
          this.products = response.results || response;
          this.loading = false;
        },
        (error) => {
          console.error("Error searching products", error);
          this.products = [];
          this.loading = false;
        },
      );
    }, 500);
  }

  deleteProduct(product: any) {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      this.api.delete(`/products/${product.id}/`).subscribe(
        () => {
          this.loadProducts();
          alert("Producto eliminado exitosamente");
        },
        (error) => {
          console.error("Error deleting product", error);
          alert(
            "Hubo un error al intentar eliminar el producto: " +
              error.error?.detail,
          );
        },
      );
    }
  }

  onVenderMeLi() {
    this.api.get<any>("/integrations/meli/auth-url/").subscribe({
      next: (res: any) => {
        if (!res.is_linked) {
          if (confirm("Tu cuenta de Mercado Libre no esta vinculada. Deseas vincularla ahora?")) {
            window.open(res.auth_url, "_blank");
          }
          return;
        }
        
        window.open("https://www.mercadolibre.com.ar/publicar", "_blank");
      },
      error: (err: any) => {
        console.error("Error checking MeLi status", err);
        alert("Error al verificar el estado de Mercado Libre. Intentelo de nuevo.");
      }
    });
  }
}
