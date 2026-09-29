import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  LucideAngularModule,
  Image,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Upload,
} from "lucide-angular";
import { ApiService } from "../../../core/services/api.service";

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  imageFile?: File;
  imagePreview?: string;
  link: string;
  position: number;
  is_active: boolean;
  created_at: string;
  editing?: boolean;
  editTitle?: string;
  editSubtitle?: string;
  editLink?: string;
  editIsActive?: boolean;
  deleting?: boolean;
}

@Component({
  selector: "app-banners",
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  styles: [
    `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in { animation: fadeIn 0.3s ease-out; }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .animate-scale-in { animation: scaleIn 0.25s ease-out; }
    `,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg md:text-2xl font-extrabold text-slate-900 uppercase tracking-wider" style="font-family: Sora, sans-serif;">
            Banners
          </h1>
          <p class="text-slate-500 text-xs md:text-sm mt-0.5">
            Gestioná los banners del carrusel de tu tienda.
          </p>
        </div>
        <button
          (click)="openNewForm()"
          class="flex items-center gap-1.5 px-3 md:px-5 py-1.5 md:py-2.5 rounded-lg bg-ferre-400 text-slate-800 font-bold text-xs md:text-sm hover:bg-ferre-500 transition-all shadow-sm self-start"
        >
          <lucide-icon [name]="Plus" size="14"></lucide-icon>
          <span class="hidden sm:inline">Nuevo Banner</span>
        </button>
      </div>

      <!-- New Banner Form -->
      <div
        *ngIf="showNewForm"
        class="bg-white border border-slate-200 rounded-xl shadow-sm p-6 animate-scale-in"
      >
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 rounded-lg bg-ferre-50 flex items-center justify-center">
            <lucide-icon [name]="Image" size="18" class="text-amber-800"></lucide-icon>
          </div>
          <h2 class="text-lg font-extrabold text-slate-900 uppercase tracking-wider" style="font-family: Sora, sans-serif;">Crear Nuevo Banner</h2>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Imagen</label>
            <label class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-dashed border-slate-300 text-slate-500 hover:border-ferre-400 hover:text-ferre-400 transition-all cursor-pointer text-sm">
              <lucide-icon [name]="Upload" size="16"></lucide-icon>
              {{ newBanner.imageFile ? newBanner.imageFile.name : 'Seleccionar imagen...' }}
              <input type="file" accept="image/*" class="hidden" (change)="onNewImageSelected($event)"/>
            </label>
          </div>
        </div>

        <div class="flex items-center justify-between mt-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" [(ngModel)]="newBanner.is_active" class="w-4 h-4 rounded border-slate-300 text-ferre-700 focus:ring-ferre-400"/>
            <span class="text-sm text-slate-600 font-medium">Activo</span>
          </label>
          <div class="flex items-center gap-3">
            <button (click)="showNewForm = false" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-700 transition-all text-sm font-medium">
              Cancelar
            </button>
            <button
              (click)="createBanner()"
              [disabled]="!newBanner.imageFile || creatingBanner"
              class="px-5 py-2.5 rounded-lg bg-ferre-400 text-slate-800 font-bold text-sm hover:bg-ferre-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <div *ngIf="creatingBanner" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <lucide-icon *ngIf="!creatingBanner" [name]="Save" size="16"></lucide-icon>
              {{ creatingBanner ? 'Creando...' : 'Crear Banner' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-20">
        <div class="w-8 h-8 border-2 border-slate-200 border-t-ferre-400 rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-slate-500 text-sm">Cargando banners...</p>
      </div>

      <!-- Banner Cards -->
      <div *ngIf="!loading" class="grid gap-2 md:gap-3">
        <div
          *ngFor="let banner of banners; let i = index"
          class="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all group animate-fade-in"
          [style.animation-delay]="i * 40 + 'ms'"
        >
          <!-- View Mode -->
          <div class="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4" *ngIf="!banner.editing">
            <!-- Banner Preview -->
            <div class="w-full sm:w-40 h-20 md:h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
              <img *ngIf="banner.image" [src]="banner.image" [alt]="banner.title" class="w-full h-full object-cover"/>
              <div *ngIf="!banner.image" class="w-full h-full flex items-center justify-center">
                <lucide-icon [name]="Image" size="24" class="text-slate-400"></lucide-icon>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-bold text-slate-900 text-sm md:text-base truncate">Banner #{{ i + 1 }}</p>
                <span *ngIf="!banner.is_active" class="text-[9px] md:text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                  <lucide-icon [name]="EyeOff" size="10"></lucide-icon> Inactivo
                </span>
                <span *ngIf="banner.is_active" class="text-[9px] md:text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                  <lucide-icon [name]="Eye" size="10"></lucide-icon> Activo
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              <div class="flex flex-col gap-0.5 md:gap-1 mr-0.5 md:mr-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button (click)="moveBanner(banner, -1)" class="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all disabled:opacity-30" [disabled]="i === 0">
                  <lucide-icon [name]="ArrowUp" size="12"></lucide-icon>
                </button>
                <button (click)="moveBanner(banner, 1)" class="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all disabled:opacity-30" [disabled]="i === banners.length - 1">
                  <lucide-icon [name]="ArrowDown" size="12"></lucide-icon>
                </button>
              </div>
              <button
                (click)="startEdit(banner)"
                title="Editar banner"
                class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <lucide-icon [name]="Pencil" size="14"></lucide-icon>
              </button>
              <button
                (click)="confirmDelete(banner)"
                title="Eliminar banner"
                class="p-2.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
              >
                <lucide-icon [name]="Trash2" size="16"></lucide-icon>
              </button>
            </div>
          </div>

          <!-- Edit Mode -->
          <div class="p-4 animate-scale-in" *ngIf="banner.editing">
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nueva imagen</label>
                <label class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-dashed border-slate-300 text-slate-500 hover:border-ferre-400 hover:text-ferre-400 transition-all cursor-pointer text-sm">
                  <lucide-icon [name]="Upload" size="16"></lucide-icon>
                  {{ banner.imageFile ? banner.imageFile.name : 'Cambiar imagen...' }}
                  <input type="file" accept="image/*" class="hidden" (change)="onEditImageSelected($event, banner)"/>
                </label>
              </div>
            </div>
            <div class="flex items-center justify-between mt-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="banner.editIsActive" class="w-4 h-4 rounded border-slate-300 text-ferre-700 focus:ring-ferre-400"/>
                <span class="text-sm text-slate-600 font-medium">Activo</span>
              </label>
              <div class="flex items-center gap-3">
                <button (click)="cancelEdit(banner)" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-700 transition-all text-sm font-medium">
                  Cancelar
                </button>
                <button
                  (click)="saveEdit(banner)"
                  [disabled]="savingEdit"
                  class="px-5 py-2 rounded-lg bg-ferre-400 text-slate-800 font-bold text-sm hover:bg-ferre-500 transition-all disabled:opacity-40 flex items-center gap-2"
                >
                  <div *ngIf="savingEdit" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <lucide-icon *ngIf="!savingEdit" [name]="CheckCircle" size="14"></lucide-icon>
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && banners.length === 0" class="text-center py-20">
        <div class="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-300">
          <lucide-icon [name]="Image" size="28" class="text-slate-400"></lucide-icon>
        </div>
        <p class="text-slate-600 font-bold">No hay banners aun</p>
        <p class="text-slate-400 text-sm mt-1">Crea tu primer banner para mostrar en el carrusel de la tienda.</p>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="deletingBanner" class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center" (click)="deletingBanner = null">
        <div class="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full mx-4 animate-scale-in shadow-lg" (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <lucide-icon [name]="AlertCircle" size="20" class="text-red-600"></lucide-icon>
            </div>
            <h3 class="text-lg font-extrabold text-slate-900 uppercase tracking-wider" style="font-family: Sora, sans-serif;">Eliminar banner?</h3>
          </div>
          <p class="text-slate-500 text-sm mb-6">
            Estas por eliminar el banner
            <strong class="text-slate-900">#{{ banners.indexOf(deletingBanner!) + 1 }}</strong>.
            Esta accion no se puede deshacer.
          </p>
          <div class="flex justify-end gap-3">
            <button (click)="deletingBanner = null" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all">
              Cancelar
            </button>
            <button (click)="deleteBanner()" class="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all flex items-center gap-2">
              <lucide-icon [name]="Trash2" size="14"></lucide-icon>
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <!-- Crop Modal -->
      <div
        *ngIf="showCropModal"
        class="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        (mouseup)="onCropMouseUp()"
        (touchend)="onCropMouseUp()"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 animate-scale-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-extrabold text-slate-900 uppercase tracking-wider" style="font-family: Sora, sans-serif;">Ajustar Imagen</h3>
            <button (click)="cancelCrop()" class="text-slate-400 hover:text-slate-600 transition-colors">
              <lucide-icon [name]="X" size="20"></lucide-icon>
            </button>
          </div>
          <p class="text-xs text-slate-500 mb-3">La imagen se ajustará automáticamente al formato del banner.</p>
          <p class="text-[11px] text-amber-600 font-bold mb-3">Resolución recomendada: 1920 x 640 px (proporción 3:1)</p>
          <div
            class="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-100"
            style="aspect-ratio: 3/1;"
          >
            <img
              *ngIf="cropImageSrc"
              [src]="cropImageSrc"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 border-2 border-ferre-400/50 rounded-lg pointer-events-none"></div>
          </div>
          <div class="flex items-center justify-end gap-3 mt-4">
            <button (click)="cancelCrop()" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all text-sm font-medium">
              Cancelar
            </button>
            <button (click)="confirmCrop()" class="px-5 py-2.5 rounded-lg bg-ferre-400 text-slate-800 font-bold text-sm hover:bg-ferre-500 transition-all flex items-center gap-2">
              <lucide-icon [name]="CheckCircle" size="16"></lucide-icon>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BannersComponent implements OnInit {
  api = inject(ApiService);

  Image = Image;
  Save = Save;
  CheckCircle = CheckCircle;
  AlertCircle = AlertCircle;
  Plus = Plus;
  Pencil = Pencil;
  Trash2 = Trash2;
  X = X;
  Eye = Eye;
  EyeOff = EyeOff;
  ArrowUp = ArrowUp;
  ArrowDown = ArrowDown;
  Upload = Upload;

  banners: Banner[] = [];
  loading = true;

  showNewForm = false;
  newBanner = {
    title: "",
    subtitle: "",
    imageFile: null as File | null,
    link: "",
    is_active: true,
  };
  creatingBanner = false;

  savingEdit = false;
  deletingBanner: Banner | null = null;

  // Crop modal
  showCropModal = false;
  cropImageSrc = '';
  cropOffsetX = 0;
  cropOffsetY = 0;
  cropDragging = false;
  cropStartX = 0;
  cropStartY = 0;
  cropStartOffsetX = 0;
  cropStartOffsetY = 0;
  cropTarget: 'new' | 'edit' = 'new';
  cropEditBanner: Banner | null = null;
  private cropImgEl: HTMLImageElement | null = null;

  ngOnInit() {
    this.loadBanners();
  }

  loadBanners() {
    this.loading = true;
    this.api.get<any>("/ecommerce/banners/").subscribe({
      next: (res) => {
        const data = res.results || res;
        this.banners = data.map((b: any) => ({ ...b }));
        this.banners.sort((a, b) => (a.position || 0) - (b.position || 0));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  openNewForm() {
    this.showNewForm = true;
    this.newBanner = { title: "", subtitle: "", imageFile: null, link: "", is_active: true };
  }

  onNewImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.openCropModal(input.files[0], 'new');
    }
  }

  onEditImageSelected(event: Event, banner: Banner) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.openCropModal(input.files[0], 'edit', banner);
    }
  }

  openCropModal(file: File, target: 'new' | 'edit', banner?: Banner) {
    this.cropTarget = target;
    this.cropEditBanner = banner || null;
    this.cropOffsetX = 0;
    this.cropOffsetY = 0;
    const reader = new FileReader();
    reader.onload = () => {
      this.cropImageSrc = reader.result as string;
      this.showCropModal = true;
    };
    reader.readAsDataURL(file);
  }

  onCropMouseDown(e: MouseEvent) {
    e.preventDefault();
    this.cropDragging = true;
    this.cropStartX = e.clientX;
    this.cropStartY = e.clientY;
    this.cropStartOffsetX = this.cropOffsetX;
    this.cropStartOffsetY = this.cropOffsetY;
  }

  onCropTouchStart(e: TouchEvent) {
    this.cropDragging = true;
    this.cropStartX = e.touches[0].clientX;
    this.cropStartY = e.touches[0].clientY;
    this.cropStartOffsetX = this.cropOffsetX;
    this.cropStartOffsetY = this.cropOffsetY;
  }

  onCropMouseMove(e: MouseEvent) {
    if (!this.cropDragging) return;
    this.cropOffsetX = this.cropStartOffsetX + (e.clientX - this.cropStartX);
    this.cropOffsetY = this.cropStartOffsetY + (e.clientY - this.cropStartY);
  }

  onCropTouchMove(e: TouchEvent) {
    if (!this.cropDragging) return;
    this.cropOffsetX = this.cropStartOffsetX + (e.touches[0].clientX - this.cropStartX);
    this.cropOffsetY = this.cropStartOffsetY + (e.touches[0].clientY - this.cropStartY);
  }

  onCropMouseUp() {
    this.cropDragging = false;
  }

  confirmCrop() {
    const bannerImg = new window.Image();
    bannerImg.crossOrigin = 'anonymous';
    bannerImg.onload = () => {
      const containerW = 1920;
      const containerH = 640;
      const canvas = document.createElement('canvas');
      canvas.width = containerW;
      canvas.height = containerH;
      const ctx = canvas.getContext('2d')!;
      const imgRatio = bannerImg.naturalWidth / bannerImg.naturalHeight;
      const targetRatio = containerW / containerH;
      let sx = 0, sy = 0, sw = bannerImg.naturalWidth, sh = bannerImg.naturalHeight;
      if (imgRatio > targetRatio) {
        sw = bannerImg.naturalHeight * targetRatio;
        sx = (bannerImg.naturalWidth - sw) / 2;
      } else {
        sh = bannerImg.naturalWidth / targetRatio;
        sy = (bannerImg.naturalHeight - sh) / 2;
      }
      ctx.drawImage(bannerImg, sx, sy, sw, sh, 0, 0, containerW, containerH);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' });
        if (this.cropTarget === 'new') {
          this.newBanner.imageFile = file;
        } else if (this.cropEditBanner) {
          this.cropEditBanner.imageFile = file;
        }
        this.showCropModal = false;
      }, 'image/jpeg', 0.92);
    };
    bannerImg.src = this.cropImageSrc;
  }

  cancelCrop() {
    this.showCropModal = false;
  }

  createBanner() {
    if (!this.newBanner.imageFile) return;

    this.creatingBanner = true;
    const formData = new FormData();
    formData.append("title", `Banner ${this.banners.length + 1}`);
    formData.append("subtitle", "");
    formData.append("image", this.newBanner.imageFile);
    formData.append("link", "");
    formData.append("is_active", String(this.newBanner.is_active));
    formData.append("position", String(this.banners.length));

    this.api.post<any>("/ecommerce/banners/", formData).subscribe({
      next: (created) => {
        this.banners.push({ ...created });
        this.showNewForm = false;
        this.creatingBanner = false;
      },
      error: () => {
        this.creatingBanner = false;
        alert("Error al crear el banner. Intentá de nuevo.");
      },
    });
  }

  startEdit(banner: Banner) {
    this.banners.forEach((b) => (b.editing = false));
    banner.editing = true;
    banner.editIsActive = banner.is_active;
  }

  cancelEdit(banner: Banner) {
    banner.editing = false;
    banner.imageFile = undefined;
  }

  saveEdit(banner: Banner) {
    this.savingEdit = true;
    const formData = new FormData();
    formData.append("is_active", String(banner.editIsActive));
    formData.append("position", String(banner.position));
    if (banner.imageFile) {
      formData.append("image", banner.imageFile);
    }

    this.api.patch<any>(`/ecommerce/banners/${banner.id}/`, formData).subscribe({
      next: (updated) => {
        Object.assign(banner, updated);
        banner.editing = false;
        banner.imageFile = undefined;
        this.savingEdit = false;
      },
      error: () => {
        this.savingEdit = false;
        alert("Error al actualizar el banner.");
      },
    });
  }

  confirmDelete(banner: Banner) {
    this.deletingBanner = banner;
  }

  deleteBanner() {
    if (!this.deletingBanner) return;
    const banner = this.deletingBanner;

    this.api.delete<any>(`/ecommerce/banners/${banner.id}/`).subscribe({
      next: () => {
        this.banners = this.banners.filter((b) => b.id !== banner.id);
        this.deletingBanner = null;
      },
      error: () => {
        alert("Error al eliminar el banner.");
        this.deletingBanner = null;
      },
    });
  }

  moveBanner(banner: Banner, direction: -1 | 1) {
    const index = this.banners.findIndex((b) => b.id === banner.id);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.banners.length) return;

    const temp = this.banners[index];
    this.banners[index] = this.banners[newIndex];
    this.banners[newIndex] = temp;

    this.banners.forEach((b, i) => {
      b.position = i;
      this.api.patch<any>(`/ecommerce/banners/${b.id}/`, { position: i }).subscribe();
    });
  }
}
