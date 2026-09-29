import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ApiService } from "src/app/core/services/api.service";
import {
  LucideAngularModule,
  Save,
  CreditCard,
  MessageCircle,
  ShoppingBag,
  Zap,
  Link,
  CheckCircle,
  MapPin,
  ChevronUp,
  ChevronDown,
} from "lucide-angular";

import { RouterModule, ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    RouterModule,
  ],
  templateUrl: "./settings.component.html",
  styles: [
    `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.5s ease-out forwards;
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  settingsForm: FormGroup;
  isSaving = false;
  successMessage = "";
  errorMessage = "";
  hasMpLinked = false;

  // Accordion state
  expandedSections: { [key: string]: boolean } = {
    address: false,
    payment: false,
    mercadolibre: false,
    social: false,
  };
  // Icons
  Save = Save;
  CreditCard = CreditCard;
  MessageCircle = MessageCircle;
  ShoppingBag = ShoppingBag;
  Zap = Zap;
  Link = Link;
  CheckCircle = CheckCircle;
  MapPin = MapPin;
  ChevronUp = ChevronUp;
  ChevronDown = ChevronDown;

  constructor() {
    this.settingsForm = this.fb.group({
      store_address: [""],
      bank_titular: [""],
      bank_cuit: [""],
      bank_cvu: [""],
      bank_alias: [""],
      whatsapp_number: [""],
      instagram_url: [""],
      facebook_url: [""],
    });
  }

  ngOnInit() {
    this.loadSettings();

    // Comprobar si venimos de un redirect de MP
    this.route.queryParams.subscribe((params) => {
      const code = params["code"];
      const state = params["state"];

      // Removed subdomain redirect since this is no longer a SaaS

      if (code) {
        this.finishMpAuth(code);
      } else {
        this.checkMpStatus(); // Only fetch status if not redirecting
      }
    });
  }

  checkMpStatus() {
    // We check if MP is currently linked
    this.api.get<any>("/integrations/mercadopago/auth-url/").subscribe({
      next: (data) => {
        this.hasMpLinked = data.is_linked;
      },
    });
  }

  finishMpAuth(code: string) {
    this.api
      .post<any>("/integrations/mercadopago/authorize/", {
        code,
      })
      .subscribe({
        next: () => {
          this.hasMpLinked = true;
          this.successMessage = "¡Mercado Pago vinculado exitosamente!";
          // Remove code from URL completely so it doesn't try to auth again on refresh
          this.router.navigate([], {
            queryParams: { code: null },
            queryParamsHandling: "merge",
          });
          setTimeout(() => (this.successMessage = ""), 4000);
        },
        error: (err) => {
          this.errorMessage = "Hubo un error al vincular Mercado Pago.";
          console.error(err);
        },
      });
  }

  vincularMP() {
    this.api.get<any>("/integrations/mercadopago/auth-url/").subscribe({
      next: (data) => {
        if (data.auth_url) {
          window.location.href = data.auth_url;
        } else {
          alert("Hubo un problema recuperando la URL de autorización");
        }
      },
      error: (err) => {
        console.error(err);
        const backendMsg = err.error?.error || "Error conectando al servidor.";
        alert(backendMsg);
      },
    });
  }

  loadSettings() {
    this.api.get<any>("/tenant/settings/").subscribe({
      next: (data) => {
        this.settingsForm.patchValue({
          store_address: data.store_address || "",
          bank_titular: data.bank_titular || "",
          bank_cuit: data.bank_cuit || "",
          bank_cvu: data.bank_cvu || "",
          bank_alias: data.bank_alias || "",
          whatsapp_number: data.whatsapp_number || "",
          instagram_url: data.instagram_url || "",
          facebook_url: data.facebook_url || "",
        });
      },
      error: (err) => {
        console.error("Error loading settings", err);
      },
    });
  }

  saveSettings() {
    this.isSaving = true;
    this.successMessage = "";
    this.errorMessage = "";

    const formValues = this.settingsForm.value;

    // Create FormData to support file uploads
    const formData = new FormData();
    formData.append("store_address", formValues.store_address);
    formData.append("bank_titular", formValues.bank_titular);
    formData.append("bank_cuit", formValues.bank_cuit);
    formData.append("bank_cvu", formValues.bank_cvu);
    formData.append("bank_alias", formValues.bank_alias);
    formData.append("whatsapp_number", formValues.whatsapp_number);
    formData.append("instagram_url", formValues.instagram_url);
    formData.append("facebook_url", formValues.facebook_url);

    // Use POST with FormData (not PATCH, to support multipart)
    this.api.post("/tenant/settings/", formData).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = "¡Configuración guardada exitosamente!";
        // Close all sections after saving
        this.closeAllSections();
        setTimeout(() => (this.successMessage = ""), 3000);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage =
          err.error?.error || "Hubo un error al guardar la configuración.";
        console.error("Error saving settings:", err);
      },
    });
  }

  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  closeAllSections(): void {
    Object.keys(this.expandedSections).forEach((key) => {
      this.expandedSections[key] = false;
    });
  }

  capitalizeName(event: Event) {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    if (val) {
      const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
      const controlName = input.getAttribute('formcontrolname');
      if (controlName) {
        this.settingsForm.get(controlName)?.setValue(capitalized, { emitEvent: false });
      }
    }
  }
}
