import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { Subject, debounceTime } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { AppUser } from '../../core/models';
import { Ui } from '../../shared/dialogs';
import { FaPipe } from '../../shared/fa';

@Component({
  selector: 'app-users',
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatPaginatorModule, MatProgressBarModule, FaPipe,
  ],
  template: `
    <div class="page">
      <div class="page-head">
        <h1>کاربران اپلیکیشن</h1>
        <span class="muted">{{ total() | fa }} کاربر</span>
      </div>
      <div class="card">
        <div class="filters">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>جستجوی نام یا شماره</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="q" (ngModelChange)="search$.next()" />
          </mat-form-field>
        </div>
        @if (loading()) {
          <mat-progress-bar mode="indeterminate" />
        }
        <div class="table-wrap">
          <table mat-table [dataSource]="items()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>نام</th>
              <td mat-cell *matCellDef="let u">{{ u.name || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>موبایل</th>
              <td mat-cell *matCellDef="let u"><span class="ltr">{{ u.phone | fa }}</span></td>
            </ng-container>
            <ng-container matColumnDef="photos">
              <th mat-header-cell *matHeaderCellDef>عکس‌ها</th>
              <td mat-cell *matCellDef="let u">{{ u.photos_count | fa }}</td>
            </ng-container>
            <ng-container matColumnDef="joined">
              <th mat-header-cell *matHeaderCellDef>عضویت</th>
              <td mat-cell *matCellDef="let u">{{ u.created_at_fa }}</td>
            </ng-container>
            <ng-container matColumnDef="last">
              <th mat-header-cell *matHeaderCellDef>آخرین ورود</th>
              <td mat-cell *matCellDef="let u">{{ u.last_login_at_fa || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>وضعیت</th>
              <td mat-cell *matCellDef="let u">
                <span class="badge" [class.approved]="!u.is_blocked" [class.rejected]="u.is_blocked">
                  {{ u.is_blocked ? 'مسدود' : 'فعال' }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let u">
                <button mat-button (click)="toggle(u)">
                  <mat-icon>{{ u.is_blocked ? 'lock_open' : 'block' }}</mat-icon>
                  {{ u.is_blocked ? 'رفع مسدودی' : 'مسدود کردن' }}
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols"></tr>
          </table>
        </div>
        @if (!loading() && !items().length) {
          <div class="empty">کاربری یافت نشد</div>
        }
        <mat-paginator [length]="total()" [pageSize]="30" [pageIndex]="page() - 1" (page)="onPage($event)" />
      </div>
    </div>
  `,
  styles: `.table-wrap { overflow-x: auto; } table { min-width: 720px; }`,
})
export class UsersPage {
  private api = inject(ApiService);
  private ui = inject(Ui);

  readonly cols = ['name', 'phone', 'photos', 'joined', 'last', 'status', 'actions'];
  readonly items = signal<AppUser[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(false);
  q = '';
  readonly search$ = new Subject<void>();

  constructor() {
    this.search$.pipe(debounceTime(400), takeUntilDestroyed()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.appUsers({ q: this.q, page: this.page() }).subscribe({
      next: (r) => {
        this.items.set(r.data);
        this.total.set(r.meta.total);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.ui.toast(errorMessage(e));
      },
    });
  }

  onPage(e: PageEvent): void {
    this.page.set(e.pageIndex + 1);
    this.load();
  }

  toggle(u: AppUser): void {
    this.api.setBlocked(u.id, !u.is_blocked).subscribe({
      next: (x) => {
        this.items.update((l) => l.map((i) => (i.id === x.id ? x : i)));
        this.ui.toast(x.is_blocked ? 'کاربر مسدود شد' : 'مسدودی برداشته شد');
      },
      error: (e) => this.ui.toast(errorMessage(e)),
    });
  }
}
