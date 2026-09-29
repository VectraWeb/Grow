// Guard de ruta que protege el acceso a páginas autenticadas
// Valida token JWT antes de permitir navegación
import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem("access_token");
    console.log(">>> [AuthGuard] Token encontrado:", !!token, token ? token.substring(0, 30) + "..." : "null");

    if (!token) {
      console.warn(">>> [AuthGuard] NO HAY TOKEN. Redirigiendo a login.");
      this.router.navigate(["/auth/login"]);
      return false;
    }

    try {
      const payload: any = jwtDecode(token);
      console.log(">>> [AuthGuard] Payload decodificado:", payload);
      console.log(">>> [AuthGuard] exp:", payload?.exp, "Date.now()/1000:", Date.now() / 1000);

      if (payload && payload.exp && Date.now() / 1000 > payload.exp) {
        console.warn(">>> [AuthGuard] TOKEN EXPIRADO. Redirigiendo a login.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        this.router.navigate(["/auth/login"]);
        return false;
      }
      console.log(">>> [AuthGuard] Token VÁLIDO. Permitiendo acceso.");
      return true;
    } catch (err) {
      console.error(">>> [AuthGuard] Error al decodificar token:", err);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      this.router.navigate(["/auth/login"]);
      return false;
    }
  }
}
