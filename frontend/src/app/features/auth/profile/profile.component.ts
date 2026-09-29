import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ApiService } from "src/app/core/services/api.service";
import { Router, RouterModule } from "@angular/router";
import { LucideAngularModule, User, Mail, Phone, Lock, Save, ArrowLeft, LogOut, KeyRound } from "lucide-angular";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      <div class="absolute top-0 left-0 right-0 h-1 bg-ferre-400"></div>

      <button (click)="goBack()" class="absolute top-6 left-6 z-20 text-slate-400 hover:text-ferre-400 flex items-center gap-2 transition-colors text-sm font-medium">
        <lucide-icon [name]="ArrowLeft" size="18"></lucide-icon>
        Volver
      </button>

      <div class="z-10 w-full max-w-md p-8 bg-white border border-slate-200 rounded-xl shadow-sm relative">
        <div class="text-center mb-8">
          <div class="w-14 h-14 rounded-lg bg-ferre-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <lucide-icon [name]="UserIcon" size="28" class="text-slate-800"></lucide-icon>
          </div>
          <span class="text-2xl font-extrabold tracking-wider uppercase text-slate-900" style="font-family: Sora, sans-serif;">
            Mi Perfil
          </span>
          <p class="text-slate-500 mt-1 text-sm font-medium">{{ email }}</p>
        </div>

        <!-- Password change banner -->
        <div *ngIf="showPasswordBanner" class="bg-ferre-50 border border-ferre-200 rounded-lg p-4 mb-6">
          <div class="flex items-start gap-3">
            <lucide-icon [name]="KeyRound" size="20" class="text-amber-600 mt-0.5 flex-shrink-0"></lucide-icon>
            <div>
              <p class="text-sm font-bold text-amber-800">Debes cambiar tu contraseña</p>
              <p class="text-xs text-slate-500 mt-1">Por seguridad, cambia la contraseña temporal que te asignaron.</p>
            </div>
          </div>
        </div>

        <div *ngIf="success" class="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-sm text-center font-medium mb-4">
          {{ successMsg }}
        </div>

        <!-- Profile form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre</label>
              <input formControlName="first_name" type="text"
                class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Apellido</label>
              <input formControlName="last_name" type="text"
                class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Correo Electronico</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <lucide-icon [name]="Mail" size="18" class="text-slate-400"></lucide-icon>
              </div>
              <input [value]="email" type="email" disabled
                class="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-sm cursor-not-allowed" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Telefono</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <lucide-icon [name]="Phone" size="18" class="text-slate-400"></lucide-icon>
              </div>
              <input formControlName="phone" type="tel"
                class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm"
                placeholder="1123456789" />
            </div>
          </div>

          <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
            {{ error }}
          </div>

          <button type="submit" [disabled]="loading"
            class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm uppercase tracking-wider">
            <lucide-icon *ngIf="!loading" [name]="Save" size="18"></lucide-icon>
            <div *ngIf="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            {{ loading ? "Guardando..." : "Guardar cambios" }}
          </button>
        </form>

        <!-- Password change section -->
        <div class="mt-6 pt-6 border-t border-slate-200">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <lucide-icon [name]="KeyRound" size="16" class="text-ferre-700"></lucide-icon>
            Cambiar contraseña
          </h3>
          <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="space-y-3">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Contraseña actual</label>
              <input formControlName="current_password" type="password"
                class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm"
                placeholder="Tu contraseña actual" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nueva contraseña</label>
              <input formControlName="new_password" type="password"
                class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all text-sm"
                placeholder="Minimo 6 caracteres" />
            </div>
            <div *ngIf="pwError" class="bg-red-50 border border-red-200 text-red-600 p-2 rounded-lg text-xs text-center">
              {{ pwError }}
            </div>
            <div *ngIf="pwSuccess" class="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2 rounded-lg text-xs text-center">
              Contraseña cambiada exitosamente
            </div>
            <button type="submit" [disabled]="pwLoading"
              class="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
              <lucide-icon [name]="Lock" size="16"></lucide-icon>
              {{ pwLoading ? "Cambiando..." : "Cambiar contraseña" }}
            </button>
          </form>
        </div>

        <button (click)="logout()"
          class="w-full mt-4 bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
          <lucide-icon [name]="LogOut" size="18"></lucide-icon>
          Cerrar sesion
        </button>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  UserIcon = User;
  Mail = Mail;
  Phone = Phone;
  Save = Save;
  ArrowLeft = ArrowLeft;
  LogOut = LogOut;
  KeyRound = KeyRound;
  Lock = Lock;

  form: FormGroup = this.fb.group({
    first_name: [""],
    last_name: [""],
    phone: [""],
  });

  passwordForm: FormGroup = this.fb.group({
    current_password: ["", Validators.required],
    new_password: ["", [Validators.required, Validators.minLength(6)]],
  });

  email = "";
  loading = false;
  error = "";
  success = false;
  successMsg = "";
  showPasswordBanner = false;

  pwLoading = false;
  pwError = "";
  pwSuccess = false;

  ngOnInit() {
    this.api.get<any>("/auth/profile/").subscribe({
      next: (data) => {
        this.email = data.email || "";
        this.form.patchValue({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
        });
        if (data.must_change_password) {
          this.showPasswordBanner = true;
        }
      },
    });
  }

  onSubmit() {
    this.loading = true;
    this.error = "";
    this.success = false;
    this.api.patch<any>("/auth/profile/", this.form.value).subscribe({
      next: () => {
        this.success = true;
        this.successMsg = "Perfil actualizado exitosamente";
        this.loading = false;
        setTimeout(() => (this.success = false), 3000);
      },
      error: () => { this.error = "Error al guardar"; this.loading = false; },
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;
    this.pwLoading = true;
    this.pwError = "";
    this.pwSuccess = false;
    this.api.post<any>("/auth/change-password/", this.passwordForm.value).subscribe({
      next: () => {
        this.pwSuccess = true;
        this.pwLoading = false;
        this.passwordForm.reset();
        this.showPasswordBanner = false;
        setTimeout(() => (this.pwSuccess = false), 3000);
      },
      error: (err) => {
        this.pwError = err.error?.error || "Error al cambiar contraseña";
        this.pwLoading = false;
      },
    });
  }

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_email");
    this.router.navigate(["/"]);
  }

  goBack() { this.router.navigate(["/"]); }
}
