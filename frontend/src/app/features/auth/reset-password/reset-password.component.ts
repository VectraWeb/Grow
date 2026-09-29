import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ApiService } from "src/app/core/services/api.service";
import { Router, ActivatedRoute, RouterModule } from "@angular/router";
import { LucideAngularModule, Lock, ArrowLeft, CheckCircle, Wrench } from "lucide-angular";

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      <div class="absolute top-0 left-0 right-0 h-1 bg-ferre-400"></div>

      <div class="z-10 w-full max-w-md p-8 bg-white border border-slate-200 rounded-xl shadow-sm relative">
        <div class="text-center mb-8">
          <div class="w-14 h-14 rounded-lg bg-ferre-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <lucide-icon [name]="LockIcon" size="28" class="text-slate-800"></lucide-icon>
          </div>
          <span class="text-2xl font-extrabold tracking-wider uppercase text-slate-900" style="font-family: Sora, sans-serif;">
            Ferre<span class="text-ferre-400">Nexo</span>
          </span>
          <p class="text-slate-500 mt-1 text-sm font-medium">Nueva contraseña</p>
        </div>

        <div *ngIf="success" class="text-center space-y-4">
          <div class="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg text-sm flex items-center gap-2 justify-center">
            <lucide-icon [name]="CheckCircle" size="18"></lucide-icon>
            Contraseña restablecida exitosamente
          </div>
          <button (click)="goLogin()" class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-3 rounded-lg transition-all text-sm">
            Ir al login
          </button>
        </div>

        <div *ngIf="invalid" class="text-center space-y-4">
          <div class="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm">
            El enlace es invalido o expiro. Solicita uno nuevo.
          </div>
          <button (click)="goLogin()" class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-3 rounded-lg transition-all text-sm">
            Volver al login
          </button>
        </div>

        <form *ngIf="!success && !invalid" [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nueva Contraseña</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <lucide-icon [name]="Lock" size="18" class="text-slate-400"></lucide-icon>
              </div>
              <input formControlName="new_password" type="password"
                class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all placeholder:text-slate-400 text-sm"
                placeholder="Minimo 6 caracteres" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirmar Contraseña</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <lucide-icon [name]="Lock" size="18" class="text-slate-400"></lucide-icon>
              </div>
              <input formControlName="confirm_password" type="password"
                class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all placeholder:text-slate-400 text-sm"
                placeholder="Repite la contraseña" />
            </div>
          </div>

          <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
            {{ error }}
          </div>

          <button type="submit" [disabled]="loading"
            class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm uppercase tracking-wider">
            <div *ngIf="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            {{ loading ? "Guardando..." : "Restablecer contraseña" }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  LockIcon = Wrench;
  Lock = Lock;
  CheckCircle = CheckCircle;

  form: FormGroup = this.fb.group({
    new_password: ["", [Validators.required, Validators.minLength(6)]],
    confirm_password: ["", Validators.required],
  });

  uid = "";
  token = "";
  loading = false;
  error = "";
  success = false;
  invalid = false;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.uid = params["uid"] || "";
      this.token = params["token"] || "";
      if (!this.uid || !this.token) this.invalid = true;
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    const { new_password, confirm_password } = this.form.value;
    if (new_password !== confirm_password) {
      this.error = "Las contraseñas no coinciden";
      return;
    }
    this.loading = true;
    this.error = "";
    this.api.post<any>("/auth/password-reset/confirm/", {
      uid: this.uid, token: this.token, new_password,
    }).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err) => { this.error = err.error?.error || "Error al restablecer"; this.loading = false; },
    });
  }

  goLogin() { this.router.navigate(["/auth/login"]); }
}
