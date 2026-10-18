import { Pipe, PipeTransform } from '@angular/core';

const DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function faDigits(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\d/g, (d) => DIGITS[+d]);
}

/** {{ 1234 | fa }} -> ۱۲۳۴ */
@Pipe({ name: 'fa' })
export class FaPipe implements PipeTransform {
  transform(v: string | number | null | undefined): string {
    return faDigits(v);
  }
}
