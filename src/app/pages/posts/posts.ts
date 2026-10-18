import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { POST_LABELS, Post, PostType } from '../../core/models';
import { Ui } from '../../shared/dialogs';
import { FaPipe } from '../../shared/fa';

@Component({
  selector: 'app-posts',
  imports: [
    FormsModule, RouterLink, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatPaginatorModule, MatProgressBarModule, MatSlideToggleModule, MatTooltipModule, FaPipe,
  ],
  template: `
    <div class="page">
      <div class="page-head">
        <h1>{{ labels().plural }}</h1>
        <a mat-flat-button [routerLink]="['/' + path(), 'new']"><mat-icon>add</mat-icon> افزودن {{ labels().single }}</a>
      </div>

      <div class="card">
        <div class="filters">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="grow">
            <mat-label>جستجو در عنوان</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="q" (ngModelChange)="search$.next()" />
          </mat-form-field>
        </div>
        @if (loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        <div class="grid">
          @for (p of items(); track p.id) {
            <div class="post" [class.draft]="!p.is_published">
              <a class="cover" [routerLink]="['/' + path(), p.id]" [class.round]="type() === 'celebrity'">
                @if (p.cover) {
                  <img [src]="p.cover" alt="" loading="lazy" />
                } @else {
                  <mat-icon>{{ labels().icon }}</mat-icon>
                }
              </a>
              <div class="info">
                <a class="title" [routerLink]="['/' + path(), p.id]">{{ p.title }}</a>
                @if (p.subtitle) {
                  <span class="sub">{{ p.subtitle }}</span>
                }
                <span class="muted small">ترتیب: {{ p.sort_order | fa }}</span>
              </div>
              <div class="actions">
                <mat-slide-toggle [checked]="p.is_published" (change)="togglePublish(p)" matTooltip="انتشار در اپلیکیشن" />
                <a mat-icon-button [routerLink]="['/' + path(), p.id]" matTooltip="ویرایش"><mat-icon>edit</mat-icon></a>
                <button mat-icon-button (click)="remove(p)" matTooltip="حذف"><mat-icon>delete</mat-icon></button>
              </div>
            </div>
          } @empty {
            @if (!loading()) {
              <div class="empty">هنوز موردی ثبت نشده است</div>
            }
          }
        </div>
        <mat-paginator [length]="total()" [pageSize]="20" [pageIndex]="page() - 1" (page)="onPage($event)" />
      </div>
    </div>
  `,
  styles: `
    .grow { flex: 1; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; margin-top: 12px; }
    .post { display: flex; align-items: center; gap: 12px; padding: 10px; border: 1px solid var(--color-border-default); border-radius: 16px; }
    .post.draft { opacity: .55; }
    .cover { width: 84px; height: 72px; border-radius: 12px; overflow: hidden; background: var(--color-bg-canvas); display: grid; place-items: center; color: var(--color-brand-accent); flex-shrink: 0; }
    .cover.round { width: 72px; border-radius: 50%; }
    .cover img { width: 100%; height: 100%; object-fit: cover; }
    .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .title { font-weight: 700; color: inherit; text-decoration: none; }
    .title:hover { color: var(--color-brand-secondary); }
    .sub { font-size: 12px; color: var(--color-brand-secondary); }
    .small { font-size: 11px; }
    .actions { display: flex; align-items: center; }
  `,
})
export class PostsPage {
  private api = inject(ApiService);
  private ui = inject(Ui);

  /** from route data */
  readonly type = input.required<PostType>();
  readonly labels = computed(() => POST_LABELS[this.type()]);
  readonly path = computed(() => (this.type() === 'attraction' ? 'attractions' : 'celebrities'));

  readonly items = signal<Post[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(false);
  q = '';
  readonly search$ = new Subject<void>();

  constructor() {
    effect(() => {
      this.type();
      untracked(() => {
        this.q = '';
        this.page.set(1);
        this.load();
      });
    });
    this.search$.pipe(debounceTime(400), takeUntilDestroyed()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.api.posts(this.type(), { q: this.q, page: this.page() }).subscribe({
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

  togglePublish(p: Post): void {
    this.api.updatePost(p.id, { is_published: !p.is_published }).subscribe({
      next: (u) => this.items.update((l) => l.map((x) => (x.id === u.id ? u : x))),
      error: (e) => this.ui.toast(errorMessage(e)),
    });
  }

  remove(p: Post): void {
    this.ui
      .confirm({ title: 'حذف', message: `«${p.title}» با همه تصاویرش حذف شود؟`, ok: 'حذف', danger: true })
      .subscribe((ok) => {
        if (!ok) return;
        this.api.deletePost(p.id).subscribe({
          next: () => {
            this.ui.toast('حذف شد');
            this.load();
          },
          error: (e) => this.ui.toast(errorMessage(e)),
        });
      });
  }
}
