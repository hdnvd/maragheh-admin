import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { Source } from '../../core/models';
import { Ui } from '../../shared/dialogs';
import { FaPipe } from '../../shared/fa';
import { SourceDialog } from './source-dialog';

@Component({
  selector: 'app-sources',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule, MatTooltipModule, FaPipe],
  template: `
    <div class="page">
      <div class="page-head">
        <h1>منابع خبری</h1>
        <button mat-flat-button (click)="edit(null)"><mat-icon>add</mat-icon> منبع جدید</button>
      </div>
      <p class="muted">
        اخبار هر ۳۰ دقیقه با Cron Job سی‌پنل به‌صورت خودکار دریافت می‌شوند. برای دریافت فوری روی «دریافت اکنون» بزنید.
      </p>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <div class="grid">
        @for (s of sources(); track s.id) {
          <div class="card source" [class.off]="!s.is_active">
            <div class="head">
              <mat-icon class="type">{{ s.type === 'rss' ? 'rss_feed' : 'newspaper' }}</mat-icon>
              <div class="name">
                <strong>{{ s.name }}</strong>
                <span class="muted">{{ s.type === 'rss' ? 'خوراک RSS' : 'برچسب خبرگزاری مهر' }}</span>
              </div>
              @if (!s.is_active) {
                <span class="badge neutral">غیرفعال</span>
              }
            </div>
            <a class="url ltr" [href]="s.url" target="_blank" rel="noopener">{{ decode(s.url) }}</a>
            <div class="stats">
              <span><mat-icon>article</mat-icon>{{ s.news_count | fa }} خبر</span>
              <span><mat-icon>schedule</mat-icon>{{ s.last_crawled_at_fa || 'هنوز اجرا نشده' }}</span>
              @if (s.keyword) {
                <span><mat-icon>filter_alt</mat-icon>{{ s.keyword }}</span>
              }
            </div>
            @if (s.last_error) {
              <div class="err"><mat-icon>error</mat-icon>{{ s.last_error }}</div>
            }
            <div class="actions">
              <button mat-flat-button (click)="crawl(s)" [disabled]="crawling() === s.id">
                @if (crawling() === s.id) {
                  <mat-spinner diameter="18" />
                } @else {
                  <mat-icon>sync</mat-icon>
                }
                دریافت اکنون
              </button>
              <button mat-stroked-button (click)="edit(s)"><mat-icon>edit</mat-icon> ویرایش</button>
              <button mat-icon-button (click)="remove(s)" matTooltip="حذف منبع و اخبار آن"><mat-icon>delete</mat-icon></button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 14px; }
    .source { display: flex; flex-direction: column; gap: 10px; }
    .source.off { opacity: .65; }
    .head { display: flex; align-items: center; gap: 12px; }
    .type { background: var(--color-action-selected); color: var(--color-brand-primary); border-radius: 12px; width: 44px; height: 44px; line-height: 44px; text-align: center; }
    .name { flex: 1; display: flex; flex-direction: column; }
    .name span { font-size: 12px; }
    .url { font-size: 12px; color: var(--color-brand-secondary); word-break: break-all; text-align: left; }
    .stats { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; color: var(--color-text-secondary); }
    .stats span { display: inline-flex; align-items: center; gap: 4px; }
    .stats mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .err { display: flex; gap: 6px; color: var(--color-status-error); background: var(--color-status-error-bg); padding: 8px 10px; border-radius: 10px; font-size: 12px; word-break: break-word; }
    .actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .actions mat-spinner { display: inline-block; margin-left: 6px; }
  `,
})
export class SourcesPage {
  private api = inject(ApiService);
  private ui = inject(Ui);
  private dialog = inject(MatDialog);

  readonly sources = signal<Source[]>([]);
  readonly loading = signal(true);
  readonly crawling = signal<number | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.api.sources().subscribe({
      next: (s) => {
        this.sources.set(s);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.ui.toast(errorMessage(e));
      },
    });
  }

  decode(url: string): string {
    try {
      return decodeURI(url);
    } catch {
      return url;
    }
  }

  edit(s: Source | null): void {
    this.dialog
      .open(SourceDialog, { data: s, direction: 'rtl' })
      .afterClosed()
      .subscribe((saved) => saved && this.load());
  }

  crawl(s: Source): void {
    this.crawling.set(s.id);
    this.api.crawl(s.id).subscribe({
      next: (r) => {
        this.crawling.set(null);
        this.ui.toast(r.message);
        this.sources.update((list) => list.map((x) => (x.id === s.id ? r.source : x)));
      },
      error: (e) => {
        this.crawling.set(null);
        this.ui.toast(errorMessage(e));
        this.load();
      },
    });
  }

  remove(s: Source): void {
    this.ui
      .confirm({
        title: 'حذف منبع',
        message: `منبع «${s.name}» و همه اخبار دریافت‌شده از آن حذف می‌شوند. ادامه می‌دهید؟`,
        ok: 'حذف',
        danger: true,
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.api.deleteSource(s.id).subscribe({
          next: () => {
            this.sources.update((list) => list.filter((x) => x.id !== s.id));
            this.ui.toast('منبع حذف شد');
          },
          error: (e) => this.ui.toast(errorMessage(e)),
        });
      });
  }
}
