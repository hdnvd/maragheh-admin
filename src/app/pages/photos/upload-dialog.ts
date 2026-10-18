import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';

/** Admin photo upload — published immediately. */
@Component({
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressBarModule],
  template: `
    <h2 mat-dialog-title>افزودن عکس به گالری</h2>
    <mat-dialog-content class="content">
      <button type="button" class="drop" (click)="file.click()">
        @if (preview()) {
          <img [src]="preview()" alt="" />
        } @else {
          <mat-icon>add_photo_alternate</mat-icon>
          <span>انتخاب عکس</span>
        }
      </button>
      <input #file type="file" accept="image/jpeg,image/png,image/webp" hidden (change)="pick($event)" />
      <mat-form-field appearance="outline">
        <mat-label>عنوان</mat-label>
        <input matInput [(ngModel)]="title" maxlength="120" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>توضیحات</mat-label>
        <textarea matInput rows="3" [(ngModel)]="description" maxlength="1000"></textarea>
      </mat-form-field>
      @if (busy()) {
        <mat-progress-bar mode="indeterminate" />
      }
      @if (error()) {
        <div class="error">{{ error() }}</div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>انصراف</button>
      <button mat-flat-button (click)="save()" [disabled]="!fileObj || !title.trim() || busy()">انتشار</button>
    </mat-dialog-actions>
  `,
  styles: `
    .content { display: flex; flex-direction: column; gap: 8px; min-width: min(460px, 85vw); }
    .drop { border: 2px dashed var(--color-border-default); border-radius: 16px; height: 220px; background: var(--color-bg-canvas); cursor: pointer;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--color-brand-primary); overflow: hidden; padding: 0; font: inherit; }
    .drop img { width: 100%; height: 100%; object-fit: cover; }
    .drop mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .error { color: var(--color-status-error); }
  `,
})
export class UploadDialog {
  private api = inject(ApiService);
  private ref = inject(MatDialogRef<UploadDialog>);
  readonly preview = signal<string | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  fileObj: File | null = null;
  title = '';
  description = '';

  pick(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.fileObj = f;
    this.preview.set(URL.createObjectURL(f));
  }

  save(): void {
    if (!this.fileObj) return;
    const fd = new FormData();
    fd.append('image', this.fileObj);
    fd.append('title', this.title.trim());
    fd.append('description', this.description.trim());
    this.busy.set(true);
    this.api.uploadPhoto(fd).subscribe({
      next: (p) => this.ref.close(p),
      error: (e) => {
        this.busy.set(false);
        this.error.set(errorMessage(e));
      },
    });
  }
}
