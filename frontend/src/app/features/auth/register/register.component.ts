import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ApiService } from "src/app/core/services/api.service";
import { Router, RouterModule } from "@angular/router";
import { LucideAngularModule, UserPlus, Mail, Lock, User, Phone, ArrowLeft, CheckCircle } from "lucide-angular";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      <div class="absolute top-0 left-0 right-0 h-1 bg-ferre-400"></div>

      <button (click)="goHome()" class="absolute top-6 left-6 z-20 text-slate-400 hover:text-ferre-400 flex items-center gap-2 transition-colors text-sm font-medium">
        <lucide-icon [name]="ArrowLeft" size="18"></lucide-icon>
        Volver a la tienda
      </button>

      <div class="z-10 w-full max-w-md p-8 bg-white border border-slate-200 rounded-xl shadow-sm relative">
        <div class="text-center mb-8">
          <div class="w-14 h-14 rounded-lg bg-ferre-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <lucide-icon [name]="UserPlus" size="28" class="text-slate-800"></lucide-icon>
          </div>
          <span class="text-2xl font-extrabold tracking-wider uppercase text-slate-900" style="font-family: Sora, sans-serif;">
            Ferre<span class="text-ferre-400">Nexo</span>
          </span>
          <p class="text-slate-500 mt-1 text-sm font-medium">Crea tu cuenta</p>
        </div>

        <div *ngIf="success" class="text-center space-y-4">
          <div class="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg text-sm flex items-center gap-2 justify-center">
            <lucide-icon [name]="CheckCircle" size="18"></lucide-icon>
            Cuenta creada exitosamente
          </div>
          <button (click)="goLogin()" class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-3 rounded-lg transition-all text-sm">
            Ir al login
          </button>
        </div>

        <form *ngIf="!success" [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre</label>
              <input formControlName="first_name" type="text"
                class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm"
                placeholder="Juan" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Apellido</label>
              <input formControlName="last_name" type="text"
                class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm"
                placeholder="Perez" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Correo Electronico</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <lucide-icon [name]="Mail" size="18" class="text-slate-400"></lucide-icon>
              </div>
              <input formControlName="email" type="email"
                class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm"
                placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Telefono (opcional)</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <lucide-icon [name]="Phone" size="18" class="text-slate-400"></lucide-icon>
              </div>
              <input formControlName="phone" type="tel"
                class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm"
                placeholder="1123456789" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Contraseña</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <lucide-icon [name]="Lock" size="18" class="text-slate-400"></lucide-icon>
              </div>
              <input formControlName="password" type="password"
                class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm"
                placeholder="Minimo 6 caracteres" />
            </div>
          </div>

          <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
            {{ error }}
          </div>

          <button type="submit" [disabled]="loading"
            class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm uppercase tracking-wider">
            <lucide-icon *ngIf="!loading" [name]="UserPlus" size="18"></lucide-icon>
            <div *ngIf="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            {{ loading ? "Creando..." : "Crear cuenta" }}
          </button>
        </form>

        <p *ngIf="!success" class="text-center text-slate-500 text-sm mt-6">
          Ya tenes cuenta?
          <a routerLink="/auth/login" class="text-ferre-700 hover:text-amber-800 font-medium transition-colors">Inicia sesion</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  UserPlus = UserPlus;
  Mail = Mail;
  Lock = Lock;
  User = User;
  Phone = Phone;
  ArrowLeft = ArrowLeft;
  CheckCircle = CheckCircle;

  form: FormGroup = this.fb.group({
    first_name: ["", Validators.required],
    last_name: ["", Validators.required],
    email: ["", [Validators.required, Validators.email]],
    phone: [""],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  loading = false;
  error = "";
  success = false;

  onSubmit() {
    if (this.form.invalid) {
      this.error = "Completa todos los campos obligatorios";
      return;
    }
    this.loading = true;
    this.error = "";
    this.api.post<any>("/auth/register/", this.form.value).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.email?.[0] || err.error?.error || "Error al crear la cuenta";
        this.error = msg;
      },
    });
  }

  goLogin() { this.router.navigate(["/auth/login"]); }
  goHome() { this.router.navigate(["/"]); }
}
