import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Adds the bearer token and signs out when the API says the token is no longer valid (401).
 * A 403 is not treated as "logged out": shared-hosting firewalls (ModSecurity/Imunify) can answer
 * individual requests with their own 403 page, and that must not end the admin's session.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const authed = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
    : req.clone({ setHeaders: { Accept: 'application/json' } });

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      const isLogin = req.url.endsWith('/admin/login');
      if (!isLogin && err.status === 401) {
        auth.logout(false);
      }
      return throwError(() => err);
    }),
  );
};

/** First readable message from a Laravel error response. */
export function errorMessage(err: unknown, fallback = 'خطا در ارتباط با سرور'): string {
  if (err instanceof HttpErrorResponse) {
    // status 0 = network failure; err.error is then the browser's English TypeError ("Failed to fetch")
    if (err.status === 0) return 'سرور در دسترس نیست. اتصال اینترنت را بررسی کنید.';
    const body = err.error;
    if (body?.errors) {
      const first = Object.values(body.errors as Record<string, string[]>)[0];
      if (first?.length) return first[0];
    }
    if (body?.message) return body.message;
  }
  return fallback;
}
