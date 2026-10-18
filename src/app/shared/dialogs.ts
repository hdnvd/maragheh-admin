import { Component, Injectable, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';

interface ConfirmData {
  title: string;
  message: string;
  ok?: string;
  danger?: boolean;
}

@Component({
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>انصراف</button>
      <button mat-flat-button [mat-dialog-close]="true" [class.danger]="data.danger">{{ data.ok ?? 'تایید' }}</button>
    </mat-dialog-actions>
  `,
  styles: `.danger { --mat-button-filled-container-color: #b3261e; }`,
})
export class ConfirmDialog {
  readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
}

interface PromptData {
  title: string;
  label: string;
  value?: string;
  ok?: string;
  multiline?: boolean;
}

@Component({
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>{{ data.label }}</mat-label>
        @if (data.multiline) {
          <textarea matInput rows="3" [(ngModel)]="value" maxlength="300"></textarea>
        } @else {
          <input matInput [(ngModel)]="value" />
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>انصراف</button>
      <button mat-flat-button [mat-dialog-close]="{ value }">{{ data.ok ?? 'ثبت' }}</button>
    </mat-dialog-actions>
  `,
  styles: `mat-form-field { min-width: min(420px, 80vw); }`,
})
export class PromptDialog {
  readonly data = inject<PromptData>(MAT_DIALOG_DATA);
  value = this.data.value ?? '';
}

/** Small facade over MatDialog + MatSnackBar used by every page. */
@Injectable({ providedIn: 'root' })
export class Ui {
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  confirm(data: ConfirmData): Observable<boolean | undefined> {
    return this.dialog.open(ConfirmDialog, { data, direction: 'rtl' }).afterClosed();
  }

  /** Emits {value} on submit, undefined on cancel. */
  prompt(data: PromptData): Observable<{ value: string } | undefined> {
    return this.dialog.open(PromptDialog, { data, direction: 'rtl' }).afterClosed();
  }

  toast(message: string): void {
    this.snack.open(message, 'بستن', { duration: 3500, direction: 'rtl' });
  }
}
