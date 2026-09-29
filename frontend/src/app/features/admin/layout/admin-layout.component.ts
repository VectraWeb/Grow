import { Component, inject, OnInit } from "@angular/core";
import { ApiService } from "src/app/core/services/api.service";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import {
  LucideAngularModule,
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Settings,
  LogOut,
  Home,
  Layers,
  Image,
  Menu,
  X,
  Wrench,
} from "lucide-angular";

@Component({
  selector: "app-admin-layout",
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  styles: [`
    :host { display: block; }
    .sidebar-link {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.625rem 0.75rem; border-radius: 0.5rem;
      font-size: 0.875rem; font-weight: 500;
      color: #64748b;
      transition: all 0.15s;
    }
    .sidebar-link:hover {
      background: #fffbe6;
      color: #a67000;
    }
    .sidebar-link.sidebar-active {
      background: #fffbe6;
      color: #a67000;
      font-weight: 600;
    }
    .sidebar-link.sidebar-active lucide-icon { color: #a67000; }
  `],
  template: `
    <div class="flex h-dvh bg-slate-50 text-slate-700 font-sans">
      <div
        *ngIf="sidebarOpen"
        class="fixed inset-0 bg-black/20 z-30 lg:hidden"
        (click)="sidebarOpen = false"
      ></div>

      <aside
        class="fixed lg:static inset-y-0 left-0 w-64 flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 bg-[#f0ece5] border-r border-slate-200"
        [class.-translate-x-full]="!sidebarOpen"
        [class.translate-x-0]="sidebarOpen"
      >
        <div class="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
          <div class="w-9 h-9 rounded-lg bg-ferre-400 flex items-center justify-center shadow-sm">
            <lucide-icon [name]="WrenchIcon" size="20" class="text-slate-800"></lucide-icon>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-extrabold tracking-wider text-slate-900 uppercase" style="font-family: Sora, sans-serif;">
              Ferre<span class="text-ferre-400">Nexo</span>
            </span>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Admin Panel</span>
          </div>
          <button (click)="sidebarOpen = false" class="lg:hidden p-1 text-slate-400 hover:text-slate-700 ml-auto">
            <lucide-icon [name]="X" size="18"></lucide-icon>
          </button>
        </div>

        <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <a routerLink="/admin/dashboard" routerLinkActive="sidebar-active" [routerLinkActiveOptions]="{exact:true}"
            class="sidebar-link" (click)="closeSidebarOnMobile()">
            <lucide-icon [name]="LayoutDashboard" size="18"></lucide-icon>
            Dashboard
          </a>
          <a routerLink="/admin/products" routerLinkActive="sidebar-active"
            class="sidebar-link" (click)="closeSidebarOnMobile()">
            <lucide-icon [name]="Package" size="18"></lucide-icon>
            Productos
          </a>
          <a routerLink="/admin/pos" routerLinkActive="sidebar-active"
            class="sidebar-link" (click)="closeSidebarOnMobile()">
            <lucide-icon [name]="ShoppingCart" size="18"></lucide-icon>
            Generar Remitos
          </a>
          <a routerLink="/admin/orders" routerLinkActive="sidebar-active"
            class="sidebar-link" (click)="closeSidebarOnMobile()">
            <lucide-icon [name]="ClipboardList" size="18"></lucide-icon>
            Ordenes
          </a>
          <a routerLink="/admin/categories" routerLinkActive="sidebar-active"
            class="sidebar-link" (click)="closeSidebarOnMobile()">
            <lucide-icon [name]="Layers" size="18"></lucide-icon>
            Categorias
          </a>
          <a routerLink="/admin/banners" routerLinkActive="sidebar-active"
            class="sidebar-link" (click)="closeSidebarOnMobile()">
            <lucide-icon [name]="ImageIcon" size="18"></lucide-icon>
            Banners
          </a>

          <div class="h-px my-3 bg-slate-100"></div>

          <a routerLink="/admin/settings" routerLinkActive="sidebar-active"
            class="sidebar-link" (click)="closeSidebarOnMobile()">
            <lucide-icon [name]="Settings" size="18"></lucide-icon>
            Configuracion
          </a>
        </nav>

        <div class="p-4 border-t border-slate-100">
          <button (click)="logout()" class="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all text-sm font-medium">
            <lucide-icon [name]="LogOut" size="18"></lucide-icon>
            Cerrar Sesion
          </button>
        </div>
      </aside>

      <main class="flex-1 flex flex-col h-dvh overflow-hidden">
        <div class="h-16 flex items-center justify-between px-4 lg:px-6 shrink-0 bg-[#f0ece5] border-b border-slate-200">
          <div class="flex items-center gap-3">
            <button (click)="sidebarOpen = true" class="lg:hidden p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all">
              <lucide-icon [name]="MenuIcon" size="20"></lucide-icon>
            </button>
            <h1 class="text-xs font-bold text-slate-400 uppercase tracking-[0.18em]">
              Consola de Administracion
            </h1>
          </div>
          <div class="flex items-center gap-3">
            <a routerLink="/" class="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all text-sm font-bold border-2 border-slate-300">
              Salir
            </a>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto w-full bg-slate-50">
          <div class="max-w-7xl mx-auto p-4 lg:p-6 overflow-x-hidden">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class AdminLayoutComponent implements OnInit {
  router = inject(Router);
  api = inject(ApiService);

  tenantName: string = "FerreNexo";
  sidebarOpen = false;

  LayoutDashboard = LayoutDashboard;
  Package = Package;
  ShoppingCart = ShoppingCart;
  ClipboardList = ClipboardList;
  Settings = Settings;
  Layers = Layers;
  LogOut = LogOut;
  MenuIcon = Menu;
  X = X;
  WrenchIcon = Wrench;
  ImageIcon = Image;
  Home = Home;

  ngOnInit() {
    this.api.get<any>('/auth/profile/').subscribe({
      next: (res) => {
        this.tenantName = res.tenant_name || "FerreNexo";
      },
      error: () => {
        this.tenantName = "FerreNexo";
      }
    });
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth < 1024) {
      this.sidebarOpen = false;
    }
  }

  logout(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("sessionId");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    this.router.navigate(["/"]);
  }
}
