import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { News } from '../../core/models';

@Component({
  imports: [MatDialogModule, MatButtonModule, MatProgressBarModule],
  template: `
    @if (news(); as n) {
      <h2 mat-dialog-title>{{ n.title }}</h2>
      <mat-dialog-content>
        <div class="meta">{{ n.source?.name }} · {{ n.published_at_fa }}</div>
        @if (n.image) {
          <img class="cover" [src]="n.image" alt="" referrerpolicy="no-referrer" />
        }
        @if (n.summary) {
          <p class="lead">{{ n.summary }}</p>
        }
        <!-- body_html is sanitized on the server and again by Angular's [innerHTML] -->
        <div class="body" [innerHTML]="n.body_html"></div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <a mat-button [href]="n.url" target="_blank" rel="noopener">مشاهده در منبع</a>
        <button mat-flat-button mat-dialog-close>بستن</button>
      </mat-dialog-actions>
    } @else {
      <mat-dialog-content><mat-progress-bar mode="indeterminate" /></mat-dialog-content>
    }
  `,
  styles: `
    .meta { color: var(--color-text-secondary); font-size: 13px; margin-bottom: 12px; }
    .cover { width: 100%; border-radius: 14px; margin-bottom: 12px; }
    .lead { font-weight: 700; line-height: 2; background: var(--color-bg-canvas); padding: 12px; border-radius: 12px; }
    .body { line-height: 2.1; text-align: justify; }
    .body ::ng-deep img { max-width: 100%; border-radius: 12px; }
  `,
})
export class NewsPreviewDialog {
  private id = inject<number>(MAT_DIALOG_DATA);
  readonly news = signal<News | null>(null);

  constructor() {
    inject(ApiService).newsDetail(this.id).subscribe((n) => this.news.set(n));
  }
}
