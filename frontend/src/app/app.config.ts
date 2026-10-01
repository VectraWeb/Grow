// Configuración principal de la aplicación Angular: providers, rutas e interceptores
// Define comportamiento global y dependencias
import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from "@angular/core";
import {
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
  PreloadAllModules,
  withViewTransitions,
} from "@angular/router";

import { routes } from "./app.routes";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideServiceWorker } from "@angular/service-worker";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
      // Pre-carga lazy chunks en background después del boot → navegación instantánea
      withPreloading(PreloadAllModules),
      // Transiciones nativas del browser entre rutas (Angular 17+)
      withViewTransitions({ skipInitialTransition: true }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    // Service Worker PWA con estrategia de registro diferida
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
