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
        <div class="bg-white rounded-3xl shadow-xl border border-emerald-100 p-8">
          <div class="text-center mb-8">
            <img src="assets/logo-tree.png" alt="Tierra Verde Grow" class="h-16 w-auto object-contain mx-auto mb-2.5" />
            <div class="flex flex-col items-center justify-center leading-none" style="font-family: Sora, sans-serif;">
              <span class="text-xs font-black tracking-widest text-[#874e04]">TIERRA</span>
              <span class="text-lg font-black tracking-wider text-[#0f9717] -mt-0.5">VERDE</span>
              <span class="text-[11px] font-black tracking-[0.25em] text-[#e0b721] -mt-0.5">GROW</span>
            </div>
            <p class="text-slate-400 mt-2.5 text-[11px] font-bold uppercase tracking-[0.15em]">Panel de Administración</p>
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
