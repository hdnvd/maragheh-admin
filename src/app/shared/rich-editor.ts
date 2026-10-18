import { Component, ElementRef, effect, forwardRef, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Minimal RTL rich-text editor (contenteditable + execCommand).
 * The server sanitizes the HTML with a whitelist, so only simple formatting survives.
 */
@Component({
  selector: 'app-rich-editor',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichEditor), multi: true }],
  template: `
    <div class="toolbar">
      <button type="button" mat-icon-button (mousedown)="$event.preventDefault()" (click)="cmd('formatBlock', 'h3')" matTooltip="تیتر">
        <mat-icon>title</mat-icon>
      </button>
      <button type="button" mat-icon-button (mousedown)="$event.preventDefault()" (click)="cmd('formatBlock', 'p')" matTooltip="پاراگراف">
        <mat-icon>notes</mat-icon>
      </button>
      <button type="button" mat-icon-button (mousedown)="$event.preventDefault()" (click)="cmd('bold')" matTooltip="پررنگ">
        <mat-icon>format_bold</mat-icon>
      </button>
      <button type="button" mat-icon-button (mousedown)="$event.preventDefault()" (click)="cmd('italic')" matTooltip="کج">
        <mat-icon>format_italic</mat-icon>
      </button>
      <button type="button" mat-icon-button (mousedown)="$event.preventDefault()" (click)="cmd('insertUnorderedList')" matTooltip="فهرست">
        <mat-icon>format_list_bulleted</mat-icon>
      </button>
      <button type="button" mat-icon-button (mousedown)="$event.preventDefault()" (click)="cmd('insertOrderedList')" matTooltip="فهرست شماره‌دار">
        <mat-icon>format_list_numbered</mat-icon>
      </button>
      <button type="button" mat-icon-button (mousedown)="$event.preventDefault()" (click)="cmd('formatBlock', 'blockquote')" matTooltip="نقل‌قول">
        <mat-icon>format_quote</mat-icon>
      </button>
      <button type="button" mat-icon-button (mousedown)="$event.preventDefault()" (click)="link()" matTooltip="پیوند">
        <mat-icon>link</mat-icon>
      </button>
      <button type="button" mat-icon-button (mousedown)="$event.preventDefault()" (click)="cmd('removeFormat')" matTooltip="حذف قالب‌بندی">
        <mat-icon>format_clear</mat-icon>
      </button>
    </div>
    <div
      #area
      class="area"
      contenteditable="true"
      dir="rtl"
      [attr.data-placeholder]="'متن کامل را اینجا بنویسید…'"
      (input)="changed()"
      (blur)="touched()"
      (paste)="paste($event)"
    ></div>
  `,
  styles: `
    :host { display: block; border: 1px solid #d8d0ce; border-radius: 12px; overflow: hidden; background: #fff; }
    :host(:focus-within) { border-color: var(--brand); box-shadow: 0 0 0 1px var(--brand); }
    .toolbar { display: flex; flex-wrap: wrap; gap: 2px; padding: 4px; background: #faf7f6; border-bottom: 1px solid #eee; }
    .area { min-height: 280px; max-height: 60vh; overflow: auto; padding: 14px 16px; line-height: 2.1; outline: none; text-align: justify; }
    .area:empty::before { content: attr(data-placeholder); color: #aaa; }
    .area ::ng-deep h3 { margin: 12px 0 6px; }
    .area ::ng-deep blockquote { border-right: 4px solid var(--brand); margin: 8px 0; padding: 4px 12px; background: #fff6f5; }
  `,
})
export class RichEditor implements ControlValueAccessor {
  private area = viewChild.required<ElementRef<HTMLDivElement>>('area');
  private pending = signal<string | null>(null);
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const html = this.pending();
      if (html !== null) this.area().nativeElement.innerHTML = html;
    });
  }

  writeValue(value: string | null): void {
    this.pending.set(value ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  cmd(name: string, value?: string): void {
    document.execCommand(name, false, value);
    this.changed();
  }

  link(): void {
    const url = prompt('آدرس پیوند (https://...)');
    if (url && /^https?:\/\//.test(url)) this.cmd('createLink', url);
  }

  /** Paste as plain text so foreign styles don't sneak in. */
  paste(e: ClipboardEvent): void {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text);
  }

  changed(): void {
    this.onChange(this.area().nativeElement.innerHTML);
  }

  touched(): void {
    this.onTouched();
  }
}
