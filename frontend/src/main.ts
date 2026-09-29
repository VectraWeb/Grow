// Punto de entrada principal de la aplicación Angular
// Inicializa y arranca el componente raíz de la aplicación
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registerLocaleData } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import localeEsAR from '@angular/common/locales/es-AR';

registerLocaleData(localeEsAR, 'es-AR');

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    { provide: LOCALE_ID, useValue: 'es-AR' },
  ]
})
  .catch((err) => console.error(err));
