import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { Ui } from '../../shared/dialogs';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-head"><h1>تغییر رمز عبور</h1></div>
      <form class="card form" [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>رمز عبور فعلی</mat-label>
          <input matInput type="password" formControlName="current_password" autocomplete="current-password" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>رمز عبور جدید (حداقل ۸ کاراکتر)</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="new-password" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>تکرار رمز عبور جدید</mat-label>
          <input matInput type="password" formControlName="password_confirmation" autocomplete="new-password" />
        </mat-form-field>
        @if (mismatch()) {
          <div class="error">تکرار رمز عبور مطابقت ندارد</div>
        }
        <button mat-flat-button [disabled]="form.invalid || busy()">ذخیره</button>
      </form>
    </div>
  `,
  styles: `
    .form { max-width: 460px; display: flex; flex-direction: column; gap: 4px; }
    .error { color: #b3261e; margin-bottom: 8px; }
  `,
})
export class SettingsPage {
  private api = inject(ApiService);
  private ui = inject(Ui);
  readonly busy = signal(false);
  readonly mismatch = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    current_password: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
  });

  save(): void {
    const v = this.form.getRawValue();
    this.mismatch.set(v.password !== v.password_confirmation);
    if (this.form.invalid || this.mismatch()) return;
    this.busy.set(true);
    this.api.changePassword(v).subscribe({
      next: (r) => {
        this.busy.set(false);
        this.form.reset();
        this.ui.toast(r.message);
      },
      error: (e) => {
        this.busy.set(false);
        this.ui.toast(errorMessage(e));
      },
    });
  }
}
