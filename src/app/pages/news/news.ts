import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { News, Source } from '../../core/models';
import { Ui } from '../../shared/dialogs';
import { FaPipe } from '../../shared/fa';
import { NewsPreviewDialog } from './news-preview';

@Component({
  selector: 'app-news',
  imports: [
    FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatButtonModule,
    MatPaginatorModule, MatProgressBarModule, MatSlideToggleModule, MatTooltipModule, FaPipe,
  ],
  templateUrl: './news.html',
  styleUrl: './news.scss',
})
export class NewsPage {
  private api = inject(ApiService);
  private ui = inject(Ui);
  private dialog = inject(MatDialog);

  readonly items = signal<News[]>([]);
  readonly sources = signal<Source[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(false);

  readonly q = signal('');
  readonly sourceId = signal<number | null>(null);
  readonly visible = signal<'' | '0' | '1'>('');

  constructor() {
    this.api.sources().subscribe({ next: (s) => this.sources.set(s) });
    toObservable(this.q)
      .pipe(skip(1), debounceTime(400), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.reload());
    this.load();
  }

  reload(): void {
    this.page.set(1);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .news({ q: this.q(), source_id: this.sourceId(), visible: this.visible(), page: this.page(), per_page: 20 })
      .subscribe({
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

  toggle(n: News): void {
    const next = !n.is_visible;
    this.api.updateNews(n.id, { is_visible: next }).subscribe({
      next: (u) => {
        this.items.update((list) => list.map((x) => (x.id === u.id ? { ...x, is_visible: u.is_visible } : x)));
        this.ui.toast(next ? 'خبر در اپلیکیشن نمایش داده می‌شود' : 'خبر از اپلیکیشن پنهان شد');
      },
      error: (e) => this.ui.toast(errorMessage(e)),
    });
  }

  preview(n: News): void {
    this.dialog.open(NewsPreviewDialog, { data: n.id, width: '760px', maxWidth: '95vw', direction: 'rtl' });
  }
}
