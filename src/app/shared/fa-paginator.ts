import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { faDigits } from './fa';

@Injectable()
export class FaPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'تعداد در صفحه';
  override nextPageLabel = 'صفحه بعد';
  override previousPageLabel = 'صفحه قبل';
  override firstPageLabel = 'صفحه اول';
  override lastPageLabel = 'صفحه آخر';
  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) return 'موردی نیست';
    const start = page * pageSize + 1;
    const end = Math.min(length, (page + 1) * pageSize);
    return faDigits(`${start} تا ${end} از ${length}`);
  };
}
