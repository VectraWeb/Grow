import { Component, Input, OnInit, OnDestroy, inject, ElementRef, HostListener, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "src/app/core/services/api.service";
import {
  LucideAngularModule,
  Store,
  Globe,
  ExternalLink,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-angular";

interface Publication {
  id: number;
  product: number;
  channel: string;
  channel_display: string;
  channel_publication_id: string | null;
  publication_url: string | null;
  status: string;
  status_display: string;
  error_message: string | null;
  last_sync: string | null;
}

interface FacebookContent {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  image_urls: string[];
  sku: string;
  brand: string;
  marketplace_url: string;
}

@Component({
  selector: "app-marketplace-publish",
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  styles: [`
    .dropdown { position: relative; display: inline-block; }
    .dropdown-menu {
      position: fixed; z-index: 9999;
      min-width: 320px; background: white; border: 1px solid #e2e8f0;
      border-radius: 0.75rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      padding: 0.5rem;
    }
    .channel-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.625rem 0.75rem; border-radius: 0.5rem;
      transition: background 0.15s; cursor: default;
    }
    .channel-row:hover { background: rgba(0,0,0,0.02); }
    .status-badge {
      font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.5rem;
      border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .status-PUBLISHED { background: rgba(16,185,129,0.1); color: #059669; }
    .status-DRAFT { background: rgba(107,114,128,0.1); color: #6b7280; }
    .status-PENDING { background: rgba(245,158,11,0.1); color: #d97706; }
    .status-ERROR { background: rgba(239,68,68,0.1); color: #dc2626; }
    .status-REMOVED { background: rgba(107,114,128,0.08); color: #6b7280; }
    .action-btn {
      padding: 0.25rem 0.5rem; border-radius: 0.375rem;
      font-size: 0.7rem; font-weight: 700; cursor: pointer;
      transition: all 0.15s; border: none;
    }
    .action-publish { background: #c2b69a; color: #1e293b; }
    .action-publish:hover { background: #f0d800; }
    .action-update { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .action-update:hover { background: rgba(59,130,246,0.18); }
    .action-delete { background: rgba(239,68,68,0.08); color: #dc2626; }
    .action-delete:hover { background: rgba(239,68,68,0.15); }
    .action-link { background: rgba(139,92,246,0.08); color: #7c3aed; text-decoration: none; }
    .action-link:hover { background: rgba(139,92,246,0.15); }
    .fb-preview {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem;
      padding: 0.75rem; margin-top: 0.5rem; font-size: 0.75rem;
    }
    .fb-preview textarea {
      width: 100%; background: white; border: 1px solid #e2e8f0;
      color: #0f172a; border-radius: 0.375rem; padding: 0.5rem;
      font-size: 0.75rem; resize: vertical; min-height: 80px;
      font-family: inherit;
    }
    .copy-toast {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      background: #059669; color: white; padding: 0.75rem 1.25rem;
      border-radius: 0.5rem; font-weight: 700; font-size: 0.85rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: fadeInUp 0.3s ease;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  template: `
    <div class="dropdown">
      <button
        #menuBtn
        (click)="toggleMenu($event)"
        class="action-btn flex items-center gap-1.5"
        [class]="hasAnyPublication ? 'bg-emerald-50 text-emerald-700' : 'bg-ferre-50 text-amber-800'"
      >
        <lucide-icon [name]="Store" size="14"></lucide-icon>
        <span>Publicar</span>
        <lucide-icon [name]="ChevronDown" size="12"></lucide-icon>
      </button>

      <div *ngIf="menuOpen" class="dropdown-menu" [style.left]="menuStyle.left" [style.top]="menuStyle.top">
        <div class="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 pt-2 pb-1">Canales de venta</div>

        <!-- Mercado Libre -->
        <div class="channel-row">
          <div class="flex items-center gap-2">
            <lucide-icon [name]="Globe" size="16" class="text-amber-500"></lucide-icon>
            <span class="text-slate-900 font-bold text-sm">Mercado Libre</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span *ngIf="getPub('MELI')" class="status-badge" [ngClass]="'status-' + getPub('MELI')!.status">
              {{ getPub('MELI')!.status_display }}
            </span>
            <span *ngIf="!getPub('MELI')" class="status-badge status-DRAFT">No publicado</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 px-3 pb-2">
          <button *ngIf="!getPub('MELI') || getPub('MELI')!.status === 'DRAFT' || getPub('MELI')!.status === 'REMOVED'"
            class="action-btn action-publish" (click)="publish('MELI')" [disabled]="loading">
            {{ loading ? 'Publicando...' : 'Publicar' }}
          </button>
          <button *ngIf="getPub('MELI')?.status === 'PUBLISHED'"
            class="action-btn action-update" (click)="updatePub(getPub('MELI')!)" [disabled]="loading">
            Actualizar
          </button>
          <a *ngIf="getPub('MELI')?.publication_url"
            class="action-btn action-link" target="_blank" [href]="getPub('MELI')!.publication_url">
            <lucide-icon [name]="ExternalLink" size="11"></lucide-icon> Ver
          </a>
          <button *ngIf="getPub('MELI')?.status === 'ERROR'"
            class="action-btn action-delete" (click)="deletePub(getPub('MELI')!)">
            <lucide-icon [name]="Trash2" size="11"></lucide-icon>
          </button>
        </div>
        <div *ngIf="getPub('MELI')?.error_message"
          class="mx-3 mb-2 text-[10px] text-red-600 bg-red-50 rounded px-2 py-1">
          {{ getPub('MELI')!.error_message }}
        </div>

        <!-- Facebook Marketplace -->
        <div class="channel-row">
          <div class="flex items-center gap-2">
            <lucide-icon [name]="Store" size="16" class="text-blue-500"></lucide-icon>
            <span class="text-slate-900 font-bold text-sm">Facebook Marketplace</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span *ngIf="getPub('FACEBOOK')" class="status-badge" [ngClass]="'status-' + getPub('FACEBOOK')!.status">
              {{ getPub('FACEBOOK')!.status_display }}
            </span>
            <span *ngIf="!getPub('FACEBOOK')" class="status-badge status-DRAFT">No publicado</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 px-3 pb-2">
          <button class="action-btn action-publish" (click)="prepareFacebook()" [disabled]="loading">
            {{ loading ? 'Preparando...' : 'Preparar publicación' }}
          </button>
          <button *ngIf="getPub('FACEBOOK')?.status === 'DRAFT'"
            class="action-btn action-delete" (click)="deletePub(getPub('FACEBOOK')!)">
            <lucide-icon [name]="Trash2" size="11"></lucide-icon>
          </button>
        </div>

        <!-- Facebook Preview -->
        <div *ngIf="fbContent" class="fb-preview mx-3 mb-2">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Vista previa FB</span>
            <div class="flex gap-1">
              <button class="action-btn action-update" (click)="copyText(fbContent!.title + '\n\n' + fbContent!.description + '\n\nPrecio: $' + fbContent!.price)">
                <lucide-icon [name]="copiedText ? Check : Copy" size="11"></lucide-icon> {{ copiedText ? 'Copiado' : 'Copiar' }}
              </button>
              <a class="action-btn action-link" [href]="fbContent!.marketplace_url" target="_blank">
                <lucide-icon [name]="ExternalLink" size="11"></lucide-icon> Abrir FB
              </a>
            </div>
          </div>
          <textarea readonly [value]="fbContent!.title + '\n\n' + fbContent!.description + '\n\nPrecio: $' + fbContent!.price + '\nCategoría: ' + fbContent!.category + '\nCondición: ' + fbContent!.condition"></textarea>
        </div>
      </div>
    </div>

    <div *ngIf="showToast" class="copy-toast">{{ toastMessage }}</div>
  `,
})
export class MarketplacePublishComponent implements OnInit {
  @Input() productId!: number;
  @ViewChild('menuBtn') menuBtn!: ElementRef;

  api = inject(ApiService);

  menuOpen = false;
  loading = false;
  publications: Publication[] = [];
  fbContent: FacebookContent | null = null;
  copiedText = false;
  showToast = false;
  toastMessage = "";
  menuStyle = { left: '0px', top: '0px' };

  Store = Store;
  Globe = Globe;
  ExternalLink = ExternalLink;
  Trash2 = Trash2;
  RefreshCw = RefreshCw;
  Copy = Copy;
  Check = Check;
  AlertCircle = AlertCircle;
  Loader2 = Loader2;
  ChevronDown = ChevronDown;

  get hasAnyPublication(): boolean {
    return this.publications.some(p => p.status === 'PUBLISHED');
  }

  ngOnInit() {
    this.loadPublications();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.menuOpen) return;
    const target = event.target as HTMLElement;
    const dropdown = this.menuBtn?.nativeElement?.closest('.dropdown');
    if (dropdown && !dropdown.contains(target)) {
      this.menuOpen = false;
    }
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.loadPublications();
      this.updateMenuPosition(event);
    }
  }

  updateMenuPosition(event: MouseEvent) {
    const btn = this.menuBtn?.nativeElement;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    let left = rect.left;
    const top = rect.bottom + 4;
    if (left + 320 > window.innerWidth) {
      left = window.innerWidth - 330;
    }
    this.menuStyle = { left: left + 'px', top: top + 'px' };
  }

  getPub(channel: string): Publication | undefined {
    return this.publications.find(p => p.channel === channel && p.status !== 'REMOVED');
  }

  loadPublications() {
    this.api.get<Publication[]>(`/integrations/marketplace/status/${this.productId}/`).subscribe({
      next: (data) => this.publications = Array.isArray(data) ? data : [],
      error: () => this.publications = [],
    });
  }

  publish(channel: string) {
    this.loading = true;
    this.api.post<any>('/integrations/marketplace/publish/', {
      product_id: this.productId,
      channel,
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (channel === 'FACEBOOK' && res.content) {
          this.fbContent = res.content;
        }
        this.loadPublications();
        this.toast(res.message || 'Publicado exitosamente.');
      },
      error: (err) => {
        this.loading = false;
        this.toast(err.error?.error || 'Error al publicar.');
      },
    });
  }

  updatePub(pub: Publication) {
    this.loading = true;
    this.api.post<any>('/integrations/marketplace/update/', {
      publication_id: pub.id,
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.content) this.fbContent = res.content;
        this.loadPublications();
        this.toast(res.message || 'Actualizado.');
      },
      error: (err) => {
        this.loading = false;
        this.toast(err.error?.error || 'Error al actualizar.');
      },
    });
  }

  deletePub(pub: Publication) {
    if (!confirm('¿Eliminar esta publicación?')) return;
    this.loading = true;
    this.api.post<any>('/integrations/marketplace/delete/', {
      publication_id: pub.id,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.loadPublications();
        this.toast('Publicación eliminada.');
      },
      error: (err) => {
        this.loading = false;
        this.toast(err.error?.error || 'Error al eliminar.');
      },
    });
  }

  prepareFacebook() {
    this.loading = true;
    this.api.get<FacebookContent>(`/integrations/marketplace/facebook-preview/${this.productId}/`).subscribe({
      next: (content) => {
        this.fbContent = content;
        this.loading = false;
        this.publish('FACEBOOK');
      },
      error: () => {
        this.loading = false;
        this.toast('Error al generar vista previa.');
      },
    });
  }

  copyText(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedText = true;
      setTimeout(() => this.copiedText = false, 2000);
    });
  }

  toast(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }
}
