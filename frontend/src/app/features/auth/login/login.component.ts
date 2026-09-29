import { Component, inject, NgZone } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "src/app/core/services/api.service";
import { Router } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  LucideAngularModule,
  LogIn,
  Lock,
  Mail,
  ArrowLeft,
  Wrench,
  Eye,
  EyeOff,
} from "lucide-angular";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-1 bg-ferre-400"></div>

      <button
        (click)="goHome()"
        class="absolute top-6 left-6 z-20 text-slate-400 hover:text-ferre-400 flex items-center gap-2 transition-colors text-sm font-medium"
      >
        <lucide-icon [name]="ArrowLeft" size="18"></lucide-icon>
        Volver a la tienda
      </button>

      <div class="z-10 w-full max-w-md">
        <div class="bg-[#f0ece5] rounded-2xl shadow-lg border border-slate-200 p-8">
          <div class="text-center mb-8">
            <div class="w-14 h-14 rounded-xl bg-ferre-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <lucide-icon [name]="LockIcon" size="28" class="text-slate-800"></lucide-icon>
            </div>
            <span
              class="text-2xl font-extrabold tracking-wider uppercase text-slate-900"
              style="font-family: Sora, sans-serif;"
            >
              Ferre<span class="text-ferre-400">Nexo</span>
            </span>
            <p class="text-slate-400 mt-1 text-sm font-medium uppercase tracking-[0.15em]">Panel de Administracion</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Correo Electronico</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <lucide-icon [name]="Mail" size="18" class="text-slate-400"></lucide-icon>
                </div>
                <input
                  formControlName="email"
                  type="email"
                  class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all placeholder:text-slate-400 text-sm"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Contraseña</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <lucide-icon [name]="Lock" size="18" class="text-slate-400"></lucide-icon>
                </div>
                <input
                  formControlName="password"
                  [type]="showPassword ? 'text' : 'password'"
                  class="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all placeholder:text-slate-400 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <lucide-icon [name]="showPassword ? EyeOff : Eye" size="18"></lucide-icon>
                </button>
              </div>
            </div>

            <div
              *ngIf="error"
              class="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm text-center font-medium"
            >
              {{ error }}
            </div>

            <button
              type="submit"
              [disabled]="loading"
              class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm uppercase tracking-wider"
            >
              <lucide-icon *ngIf="!loading" [name]="LogIn" size="18"></lucide-icon>
              <div *ngIf="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {{ loading ? "Verificando..." : "Entrar" }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  api = inject(ApiService);
  router = inject(Router);
  fb = inject(FormBuilder);
  private zone = inject(NgZone);

  LogIn = LogIn;
  Lock = Lock;
  Mail = Mail;
  ArrowLeft = ArrowLeft;
  LockIcon = Wrench;
  Eye = Eye;
  EyeOff = EyeOff;
  showPassword = false;

  loginForm: FormGroup = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", Validators.required],
  });

  loading = false;
  error = "";

  onSubmit() {
    if (this.loginForm.invalid) {
      this.error = "Por favor ingresa un correo valido y tu contraseña.";
      return;
    }

    this.loading = true;
    this.error = "";
    const { email, password } = this.loginForm.value;

    this.api.post<any>("/auth/login/", { email, password }).subscribe({
      next: (response) => {
        localStorage.setItem("access_token", response.access);
        localStorage.setItem("refresh_token", response.refresh);
        localStorage.setItem("user_email", email);
        localStorage.setItem("user_role", "admin");

        this.loading = false;

        this.zone.run(() => {
          this.router.navigate(["/admin/products"]);
        });
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401) {
          this.error = "Correo o contraseña incorrectos.";
        } else {
          this.error = "Error al conectar con el servidor. Intenta de nuevo.";
        }
      },
    });
  }

  goHome() {
    this.router.navigate(["/"]);
  }
}
