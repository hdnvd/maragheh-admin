import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MAT_PAGINATOR_DEFAULT_OPTIONS, MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { FaPaginatorIntl } from './shared/fa-paginator';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: MatPaginatorIntl, useClass: FaPaginatorIntl },
    { provide: MAT_PAGINATOR_DEFAULT_OPTIONS, useValue: { hidePageSize: true } },
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-rounded');
    }),
  ],
};
