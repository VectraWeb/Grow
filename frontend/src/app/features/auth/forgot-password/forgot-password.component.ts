import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ApiService } from "src/app/core/services/api.service";
import { Router, RouterModule } from "@angular/router";
import { LucideAngularModule, Mail, ArrowLeft, Send, Wrench } from "lucide-angular";

@Component({
  selector: "app-forgot-password",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      <div class="absolute top-0 left-0 right-0 h-1 bg-ferre-400"></div>

      <button (click)="goBack()" class="absolute top-6 left-6 z-20 text-slate-400 hover:text-ferre-400 flex items-center gap-2 transition-colors text-sm font-medium">
        <lucide-icon [name]="ArrowLeft" size="18"></lucide-icon>
        Volver al login
      </button>

      <div class="z-10 w-full max-w-md p-8 bg-white border border-slate-200 rounded-xl shadow-sm relative">
        <div class="text-center mb-8">
          <div class="w-14 h-14 rounded-lg bg-ferre-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <lucide-icon [name]="Mail" size="28" class="text-slate-800"></lucide-icon>
          </div>
          <span class="text-2xl font-extrabold tracking-wider uppercase text-slate-900" style="font-family: Sora, sans-serif;">
            Ferre<span class="text-ferre-400">Nexo</span>
          </span>
          <p class="text-slate-500 mt-1 text-sm font-medium">Recupera tu contraseña</p>
        </div>

        <div *ngIf="sent" class="text-center space-y-4">
          <div class="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg text-sm">
            Si el correo esta registrado, recibiras un enlace para restablecer tu contraseña.
          </div>
          <button (click)="goBack()" class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-3 rounded-lg transition-all text-sm">
            Volver al login
          </button>
        </div>

        <form *ngIf="!sent" [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Correo Electronico</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <lucide-icon [name]="Mail" size="18" class="text-slate-400"></lucide-icon>
              </div>
              <input formControlName="email" type="email"
                class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-ferre-400/20 focus:border-ferre-400 transition-all placeholder:text-slate-400 text-sm"
                placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
            {{ error }}
          </div>

          <button type="submit" [disabled]="loading"
            class="w-full bg-ferre-400 hover:bg-ferre-500 text-slate-800 font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm uppercase tracking-wider">
            <lucide-icon *ngIf="!loading" [name]="Send" size="18"></lucide-icon>
            <div *ngIf="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            {{ loading ? "Enviando..." : "Enviar enlace" }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  Mail = Mail;
  ArrowLeft = ArrowLeft;
  Send = Send;

  form: FormGroup = this.fb.group({ email: ["", [Validators.required, Validators.email]] });
  loading = false;
  error = "";
  sent = false;

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = "";
    this.api.post<any>("/auth/password-reset/", {
      email: this.form.value.email,
      frontend_url: window.location.origin,
    }).subscribe({
      next: () => { this.sent = true; this.loading = false; },
      error: () => { this.error = "Error al enviar. Intenta de nuevo."; this.loading = false; },
    });
  }

  goBack() { this.router.navigate(["/auth/login"]); }
}
