// Definición de rutas de la aplicación Angular con lazy loading
// Configura navegación entre features (auth, admin, ecommerce, pos)
import { Routes } from "@angular/router";
import { AuthGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    loadChildren: () =>
      import("./features/ecommerce/ecommerce.routes").then(
        (m) => m.ECOMMERCE_ROUTES,
      ),
  },
  {
    path: "admin",
    canActivate: [AuthGuard],
    loadChildren: () =>
      import("./features/admin/admin.routes").then((m) => m.ADMIN_ROUTES),
  },
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.routes").then((m) => m.AUTH_ROUTES),
  },
  { path: "**", redirectTo: "" },
];
