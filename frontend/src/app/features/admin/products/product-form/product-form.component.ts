import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ApiService } from "src/app/core/services/api.service";
import { CategoriesService } from "src/app/core/services/categories.service";
import { InputTextModule } from "primeng/inputtext";
import { InputNumberModule } from "primeng/inputnumber";
import { DropdownModule } from "primeng/dropdown";
import { ButtonModule } from "primeng/button";
import {
  LucideAngularModule,
  ArrowLeft,
  Save,
  UploadCloud,
  ExternalLink,
  Zap,
  Globe,
  Search,
  Plus,
} from "lucide-angular";
import { CheckboxModule } from "primeng/checkbox";

@Component({
  selector: "app-product-form",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ButtonModule,
    LucideAngularModule,
    CheckboxModule,
  ],
  styles: [
    `
      :host ::ng-deep {
        .custom-dark-input-number .p-inputnumber-input,
        .custom-dark-dropdown,
        .custom-dark-dropdown .p-dropdown-label,
        .p-inputtext {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          color: #0f172a !important;
          border-radius: 1rem !important;
          padding: 0.75rem 1rem !important;
          transition: all 0.3s ease !important;
        }

        .custom-dark-input-number .p-inputnumber-input:focus,
        .custom-dark-dropdown.p-focus,
        .p-inputtext:focus {
          border-color: #c2b69a !important;
          box-shadow: 0 0 0 2px rgba(166,154,120, 0.2) !important;
          background: white !important;
        }

        .custom-dark-dropdown .p-dropdown-trigger {
          color: #94a3b8 !important;
        }

        .p-dropdown-panel {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 1rem !important;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }

        .p-dropdown-items .p-dropdown-item {
          color: #64748b !important;
          transition: all 0.2s ease;
        }

        .p-dropdown-items .p-dropdown-item:hover {
          background: rgba(166,154,120, 0.06) !important;
          color: #a67000 !important;
        }

        .p-dropdown-items .p-dropdown-item.p-highlight {
          background: rgba(166,154,120, 0.1) !important;
          color: #a67000 !important;
        }

        .p-inputnumber-button {
          background: #f8fafc !important;
          border-color: #e2e8f0 !important;
          color: #64748b !important;
        }

        .p-inputnumber-button:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }
      }

      :host ::ng-deep .custom-ferre-dropdown .p-dropdown {
        width: 100% !important;
        padding: 1rem !important;
        border-radius: 1rem !important;
        border: 1px solid #e2e8f0 !important;
        background: white !important;
        color: #0f172a !important;
        transition: all 0.2s !important;
      }
      :host ::ng-deep .custom-ferre-dropdown .p-dropdown:focus,
      :host ::ng-deep .custom-ferre-dropdown .p-dropdown:focus-within {
        border-color: #c2b69a !important;
        box-shadow: 0 0 0 3px rgba(166,154,120, 0.15) !important;
      }
      :host ::ng-deep .custom-ferre-dropdown .p-dropdown .p-dropdown-label {
        color: #0f172a !important;
      }
      :host ::ng-deep .custom-ferre-dropdown .p-dropdown .p-dropdown-trigger {
        color: #94a3b8 !important;
      }
    `,
  ],
  template: `
    <div
      class="max-w-5xl mx-auto h-full flex flex-col space-y-8 pb-20 animate-in"
    >
      <!-- Top Header -->
      <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div class="flex items-center gap-4">
          <a
            routerLink="/admin/products"
            class="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
          >
            <lucide-icon [name]="ArrowLeft" size="24"></lucide-icon>
          </a>
          <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">
              {{ isEditMode ? "Editar Producto" : "Nuevo Producto" }}
            </h1>
            <p class="text-slate-500 font-medium">
              Gestión detallada de artículos en catálogo.
            </p>
          </div>
        </div>

        <button
          (click)="onSubmit()"
          [disabled]="form.invalid || isSaving"
          class="bg-ferre-400 hover:bg-ferre-500 disabled:opacity-30 text-slate-800 px-10 py-4 rounded-2xl font-black shadow-sm transition-all flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
        >
          <lucide-icon [name]="Save" size="22"></lucide-icon>
          {{ isSaving ? "Sincronizando..." : "Guardar Cambios" }}
        </button>
      </div>

      <form [formGroup]="form" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Main Details -->
        <div class="lg:col-span-2 space-y-8">
          <div
            class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8"
          >
            <h2
              class="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest text-sm"
            >
              <span class="w-2 h-2 rounded-full bg-ferre-400"></span>
              Información del Producto
            </h2>

            <div class="flex flex-col gap-3">
              <label
                class="font-bold text-slate-500 text-sm ml-1 uppercase tracking-tighter"
                >Nombre Comercial *</label
              >
              <input
                pInputText
                formControlName="name"
                placeholder="Ej. Panel LED Quantum Board 240W"
                (input)="capitalizeName($event)"
                class="w-full p-4 rounded-2xl bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-ferre-400/50 focus:border-ferre-400 transition-all placeholder-slate-400 outline-none"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="flex flex-col gap-3">
                <label
                  class="font-bold text-slate-500 text-sm ml-1 uppercase tracking-tighter"
                  >Referencia SKU / EAN *</label
                >
                <input
                  pInputText
                  formControlName="sku"
                  placeholder="LED-QB-240W"
                  class="w-full p-4 rounded-2xl bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-ferre-400/50 focus:border-ferre-400 transition-all placeholder-slate-400 font-mono uppercase outline-none"
                />
              </div>
              <div class="flex flex-col gap-3">
                <label
                  class="font-bold text-slate-500 text-sm ml-1 uppercase tracking-tighter"
                  >Categoría Asignada *</label
                >
                <div class="flex gap-2 items-center">
                  <p-dropdown
                    [options]="categories"
                    formControlName="category"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Selecciona una categoría"
                    styleClass="flex-1 custom-ferre-dropdown"
                  ></p-dropdown>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3">
              <label
                class="font-bold text-slate-500 text-sm ml-1 uppercase tracking-tighter"
                >Descripción Técnica</label
              >
              <textarea
                pInputTextarea
                formControlName="description"
                rows="6"
                placeholder="Describe las características principales del producto..."
                (input)="capitalizeName($event)"
                class="w-full p-4 rounded-2xl !bg-white !border !border-slate-200 text-slate-900 focus:ring-2 focus:ring-ferre-400/50 focus:border-ferre-400 transition-all placeholder-slate-400 resize-none outline-none"
              ></textarea>
            </div>
          </div>

          <!-- Detalles Técnicos Card -->
          <div
            class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8"
          >
            <h2
              class="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest text-sm"
            >
              <span class="w-2 h-2 rounded-full bg-ferre-400"></span>
              Ficha de Especificaciones
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="flex flex-col gap-3">
                <label
                  class="font-bold text-slate-500 text-sm ml-1 uppercase tracking-tighter"
                  >Fabricante / Marca</label
                >
                <input
                  pInputText
                  formControlName="brand"
                  placeholder="Ej. DeWalt"
                  (input)="capitalizeName($event)"
                  class="w-full p-4 rounded-2xl bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-ferre-400/50 focus:border-ferre-400 transition-all outline-none"
                />
              </div>
              <div class="flex flex-col gap-3">
                <label
                  class="font-bold text-slate-500 text-sm ml-1 uppercase tracking-tighter"
                  >Composición / Material</label
                >
                <input
                  pInputText
                  formControlName="material"
                  placeholder="Ej. Acero Reforzado"
                  (input)="capitalizeName($event)"
                  class="w-full p-4 rounded-2xl bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-ferre-400/50 focus:border-ferre-400 transition-all outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="flex flex-col gap-3">
                <label
                  class="font-bold text-slate-500 text-sm ml-1 uppercase tracking-tighter"
                  >Peso Neto</label
                >
                <input
                  pInputText
                  formControlName="weight"
                  placeholder="Ej. 2.4 Kg"
                  (input)="capitalizeName($event)"
                  class="w-full p-4 rounded-2xl bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-ferre-400/50 focus:border-ferre-400 transition-all outline-none"
                />
              </div>
              <div class="flex flex-col gap-3">
                <label
                  class="font-bold text-slate-500 text-sm ml-1 uppercase tracking-tighter"
                  >Dimensiones (An x Al x Pr)</label
                >
                <input
                  pInputText
                  formControlName="dimensions"
                  placeholder="Ej. 10x20x15 cm"
                  (input)="capitalizeName($event)"
                  class="w-full p-4 rounded-2xl bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-ferre-400/50 focus:border-ferre-400 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Media & Numbers -->
        <div class="space-y-8">
          <!-- Multimedia Section -->
          <div
            class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6"
          >
            <h2
              class="text-sm font-black text-slate-900 uppercase tracking-widest"
            >
              Galería Multimedia
            </h2>

            <div
              class="relative group border-2 border-dashed border-slate-300 rounded-3xl h-64 flex flex-col items-center justify-center overflow-hidden bg-slate-50 transition-all hover:bg-ferre-50 hover:border-ferre-300"
            >
              <input
                type="file"
                (change)="onFileSelected($event)"
                accept="image/*"
                multiple
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />

              <div
                class="flex flex-col items-center text-center p-6 relative z-10"
              >
                <div
                  class="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 border border-slate-200 shadow-sm group-hover:bg-ferre-400 group-hover:text-slate-800 transition-all"
                >
                  <lucide-icon
                    [name]="UploadCloud"
                    size="28"
                    class="text-slate-400 group-hover:text-slate-800"
                  ></lucide-icon>
                </div>
                <p class="font-black text-slate-900 text-sm">Cargar Imagenes</p>
                <p class="text-xs text-slate-500 mt-2">
                  Selecciona varias imagenes a la vez
                </p>
              </div>
            </div>

            <div *ngIf="existingImageUrls.length > 0 || previewUrls.length > 0" class="grid grid-cols-3 gap-3 mt-4">
              <div *ngFor="let url of existingImageUrls; let i = index" class="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                <img [src]="url" class="w-full h-full object-cover" />
                <button
                  type="button"
                  (click)="removeExistingImage(i)"
                  class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >x</button>
              </div>
              <div *ngFor="let url of previewUrls; let i = index" class="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                <img [src]="url" class="w-full h-full object-cover" />
                <button
                  type="button"
                  (click)="removeNewImage(i)"
                  class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >x</button>
              </div>
            </div>
          </div>

          <!-- Precios e Inventario -->
          <div
            class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6"
          >
            <h2
              class="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              Precios e Inventario
            </h2>

            <div class="flex flex-col gap-3">
              <label
                class="font-bold text-slate-500 text-sm ml-1 uppercase tracking-tighter"
                >Precio de Venta *</label
              >
              <input
                pInputText
                formControlName="price_retail"
                type="text"
                placeholder="0"
                (input)="formatPrice($event)"
                class="w-full p-4 rounded-2xl bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-ferre-400/50 focus:border-ferre-400 transition-all outline-none"
              />
            </div>

            <div class="flex flex-col gap-3">
              <label
                class="font-bold text-slate-500 text-sm ml-1 uppercase tracking-tighter"
                >Descuento (%)</label
              >
              <input
                pInputText
                formControlName="discount_percentage"
                type="number"
                placeholder="0"
                class="w-full p-4 rounded-2xl bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-ferre-400/50 focus:border-ferre-400 transition-all outline-none"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-3">
                <label
                  class="font-bold text-slate-500 text-sm ml-1 uppercase tracking-tighter"
                  >Stock Actual</label
                >
                <input
                  pInputText
                  formControlName="stock_current"
                  type="number"
                  placeholder="0"
                  class="w-full p-4 rounded-2xl bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-ferre-400/50 focus:border-ferre-400 transition-all outline-none"
                />
              </div>
              <div class="flex flex-col gap-3">
                <label
                  class="font-bold text-slate-500 text-sm ml-1 uppercase tracking-tighter"
                  >Stock Mínimo</label
                >
                <input
                  pInputText
                  formControlName="stock_minimum"
                  type="number"
                  placeholder="5"
                  class="w-full p-4 rounded-2xl bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-ferre-400/50 focus:border-ferre-400 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class ProductFormComponent implements OnInit {
  fb = inject(FormBuilder);
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  categoriesService = inject(CategoriesService);

  ArrowLeft = ArrowLeft;
  Save = Save;
  UploadCloud = UploadCloud;
  ExternalLink = ExternalLink;
  Globe = Globe;
  Plus = Plus;
  Zap = Zap;
  Search = Search;

  form: FormGroup;
  isEditMode = false;
  productId: number | null = null;
  categories: any[] = [];
  isSaving = false;

  selectedFiles: File[] = [];
  previewUrls: (string | ArrayBuffer)[] = [];
  existingImageUrls: string[] = [];

  constructor() {
    this.form = this.fb.group({
      name: ["", Validators.required],
      sku: ["", Validators.required],
      description: [""],
      category: [null, Validators.required],
      price_retail: [0, Validators.min(0)],
      price_wholesale: [0], 
      cost_price: [0],
      discount_percentage: [0, [Validators.min(0), Validators.max(100)]],
      stock_current: [0, Validators.min(0)],
      stock_minimum: [0, Validators.min(0)],
      brand: [""],
      material: [""],
      weight: [""],
      dimensions: [""],
    });
  }

  ngOnInit() {
    this.loadCategories();

    this.route.params.subscribe((params: any) => {
      if (params["id"]) {
        this.isEditMode = true;
        this.productId = +params["id"];
        this.loadProduct(this.productId);
      } else {
        this.form.patchValue({
          sku: this.generateUniqueSKU(),
        });
      }
    });
  }

  generateUniqueSKU(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "PRD-";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  loadCategories(selectId?: number) {
    this.api.get<any>("/categories/").subscribe({
      next: (res: any) => {
        this.categories = res.results || res;
        if (selectId) {
          this.form.patchValue({ category: selectId });
        }
      },
      error: () => {
        this.categories = this.categoriesService.getCategoriesArray();
      },
    });
  }

  quickAddCategory() {
    const name = prompt("Ingrese el nombre de la nueva categoría:");
    if (!name || !name.trim()) return;

    this.api.post<any>("/categories/", { name: name.trim() }).subscribe({
      next: (res: any) => {
        this.loadCategories(res.id);
      },
      error: (err: any) => {
        alert("Error al crear la categoría: " + (err.error?.detail || "Error desconocido"));
      }
    });
  }

  loadProduct(id: number) {
    this.api.get<any>(`/products/${id}/`).subscribe({
      next: (product: any) => {
        this.form.patchValue({
          name: product.name,
          sku: product.sku,
          description: product.description,
          category: product.category?.id || product.category,
          price_retail: product.price_retail,
          discount_percentage: product.discount_percentage || 0,
          stock_current: product.stock_current,
          stock_minimum: product.stock_min || product.stock_minimum,
          brand: product.brand || "",
          material: product.material || "",
          weight: product.weight || "",
          dimensions: product.dimensions || "",
        });
        this.form.get('price_retail')?.updateValueAndValidity();
        setTimeout(() => this.loadFormattedPrice());
        if (product.image) {
          this.existingImageUrls = [product.image];
        }
      },
      error: (err: any) => {
        console.error("Error loading product", err);
        alert("Error al cargar el producto para editar");
        this.router.navigate(["/admin/products"]);
      },
    });
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrls.push(reader.result!);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  removeNewImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  removeExistingImage(index: number) {
    this.existingImageUrls.splice(index, 1);
  }

  capitalizeName(event: Event) {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    if (val) {
      const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
      const controlName = input.getAttribute('formcontrolname');
      if (controlName) {
        this.form.get(controlName)?.setValue(capitalized, { emitEvent: false });
      }
    }
  }

  formatPrice(event: Event) {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\./g, '').replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    this.form.get('price_retail')?.setValue(num, { emitEvent: false });
    input.value = num > 0 ? num.toLocaleString('es-AR') : '';
  }

  loadFormattedPrice() {
    const val = this.form.get('price_retail')?.value;
    const input = document.querySelector('input[formcontrolname="price_retail"]') as HTMLInputElement;
    if (input && val) {
      input.value = val > 0 ? val.toLocaleString('es-AR') : '';
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSaving = true;
    const formValue = this.form.value;

    const formData = new FormData();
    formData.append("name", formValue.name);
    formData.append("sku", formValue.sku);
    formData.append("description", formValue.description || "Sin descripción.");
    formData.append("category", formValue.category);
    formData.append("price_retail", (formValue.price_retail || 0).toString());
    formData.append("price_wholesale", (formValue.price_retail || 0).toString());
    formData.append("cost_price", (formValue.cost_price || 0).toString());
    formData.append("stock_current", (formValue.stock_current || 0).toString());
    formData.append("stock_min", (formValue.stock_minimum || 5).toString());
    formData.append("discount_percentage", (formValue.discount_percentage || 0).toString());
    formData.append("is_active", "true");
    formData.append("is_ecommerce", "true");

    formData.append("brand", formValue.brand || "");
    formData.append("material", formValue.material || "");
    formData.append("weight", formValue.weight || "");
    formData.append("dimensions", formValue.dimensions || "");

    if (this.selectedFiles.length > 0) {
      formData.append("image", this.selectedFiles[0]);
      for (let i = 1; i < this.selectedFiles.length; i++) {
        formData.append("images", this.selectedFiles[i]);
      }
    }

    const endpoint = this.isEditMode && this.productId 
      ? `/products/${this.productId}/` 
      : `/products/`;
    
    const request = this.isEditMode && this.productId
      ? this.api.put(endpoint, formData)
      : this.api.post(endpoint, formData);

    request.subscribe({
      next: (response: any) => {
        this.isSaving = false;
        alert(`Producto ${this.isEditMode ? 'actualizado' : 'creado'} exitosamente`);
        this.router.navigate(["/admin/products"]);
      },
      error: (error: any) => {
        this.isSaving = false;
        console.error("Error saving product", error);
        const errorMsg = error.error?.detail || JSON.stringify(error.error) || error.message;
        alert("Error al guardar el producto: " + errorMsg);
      },
    });
  }
}
