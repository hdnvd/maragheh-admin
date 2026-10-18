import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Admin } from './models';

const TOKEN_KEY = 'maragheh_admin_token';
const USER_KEY = 'maragheh_admin_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly user = signal<Admin | null>(JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'));
  readonly loggedIn = computed(() => !!this.token());

  login(email: string, password: string): Observable<{ token: string; user: Admin }> {
    return this.http
      .post<{ token: string; user: Admin }>(`${environment.apiUrl}/admin/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          this.token.set(res.token);
          this.user.set(res.user);
        }),
      );
  }

  logout(callServer = true): void {
    if (callServer && this.token()) {
      this.http.post(`${environment.apiUrl}/admin/logout`, {}).subscribe({ error: () => {} });
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
    this.router.navigateByUrl('/login');
  }
}
