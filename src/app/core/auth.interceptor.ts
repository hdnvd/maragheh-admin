import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Adds the bearer token and signs out on 401/403 from admin endpoints. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const authed = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
    : req.clone({ setHeaders: { Accept: 'application/json' } });

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      const isLogin = req.url.endsWith('/admin/login');
      if (!isLogin && (err.status === 401 || err.status === 403)) {
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
