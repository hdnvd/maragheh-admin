import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { Source } from '../../core/models';

@Component({
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data?.id ? 'ویرایش منبع' : 'منبع خبری جدید' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="content">
        <mat-form-field appearance="outline">
          <mat-label>نام منبع</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>نوع</mat-label>
          <mat-select formControlName="type">
            <mat-option value="mehr_tag">صفحه برچسب خبرگزاری مهر</mat-option>
            <mat-option value="rss">خوراک RSS</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>آدرس</mat-label>
          <input matInput formControlName="url" class="ltr" placeholder="https://..." />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>کلمه کلیدی (اختیاری)</mat-label>
          <input matInput formControlName="keyword" placeholder="مراغه" />
          <mat-hint>فقط خبرهایی که این کلمه را در عنوان یا خلاصه دارند ذخیره می‌شوند</mat-hint>
        </mat-form-field>
        @if (form.value.type === 'mehr_tag') {
          <mat-form-field appearance="outline">
            <mat-label>تعداد صفحات بررسی در هر اجرا</mat-label>
            <input matInput type="number" min="1" max="10" formControlName="max_pages" />
          </mat-form-field>
        }
        <mat-slide-toggle formControlName="is_active">فعال</mat-slide-toggle>
        @if (error()) {
          <div class="error">{{ error() }}</div>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>انصراف</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid || busy()">ذخیره</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .content { display: flex; flex-direction: column; gap: 4px; min-width: min(480px, 85vw); }
    .error { color: var(--color-status-error); margin-top: 8px; }
  `,
})
export class SourceDialog {
  private api = inject(ApiService);
  private ref = inject(MatDialogRef<SourceDialog>);
  readonly data = inject<Source | null>(MAT_DIALOG_DATA);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    name: [this.data?.name ?? '', Validators.required],
    type: [this.data?.type ?? 'mehr_tag', Validators.required],
    url: [this.data?.url ?? '', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    keyword: [this.data?.keyword ?? ''],
    max_pages: [this.data?.max_pages ?? 2],
    is_active: [this.data?.is_active ?? true],
  });

  save(): void {
    if (this.form.invalid) return;
    this.busy.set(true);
    const v = this.form.getRawValue();
    this.api.saveSource({ ...v, keyword: v.keyword || null, id: this.data?.id } as Partial<Source>).subscribe({
      next: (s) => this.ref.close(s),
      error: (e) => {
        this.busy.set(false);
        this.error.set(errorMessage(e));
      },
    });
  }
}
