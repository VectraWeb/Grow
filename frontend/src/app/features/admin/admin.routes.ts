// Rutas del módulo admin: dashboard, productos, POS y órdenes
// Lazy loading de componentes del panel administrativo
import { Routes } from "@angular/router";
import { AdminDashboardComponent } from "./dashboard/admin-dashboard.component";
import { PosComponent } from "./pos/pos.component";
import { CategoriesComponent } from "./categories/categories.component";
import { OrdersComponent } from "./orders/orders.component";
import { MeliAuthComponent } from "./meli/meli-auth.component";
import { BannersComponent } from "./banners/banners.component";

import { AdminLayoutComponent } from "./layout/admin-layout.component";

export const ADMIN_ROUTES: Routes = [
  {
    path: "",
    component: AdminLayoutComponent,
    children: [
      { path: "dashboard", component: AdminDashboardComponent },
      {
        path: "products",
        loadChildren: () =>
          import("./products/products.routes").then((m) => m.PRODUCT_ROUTES),
      },
      { path: "pos", component: PosComponent },
      { path: "categories", component: CategoriesComponent },
      { path: "banners", component: BannersComponent },
      { path: "orders", component: OrdersComponent },
      { path: "meli", component: MeliAuthComponent },
      { path: "settings", loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent) },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },
];
