import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { Photo, PhotoStatus, STATUS_LABELS } from '../../core/models';
import { Ui } from '../../shared/dialogs';
import { FaPipe } from '../../shared/fa';
import { UploadDialog } from './upload-dialog';

@Component({
  selector: 'app-photos',
  imports: [
    MatButtonModule, MatButtonToggleModule, MatIconModule, MatMenuModule, MatPaginatorModule,
    MatProgressBarModule, MatTooltipModule, FaPipe,
  ],
  templateUrl: './photos.html',
  styleUrl: './photos.scss',
})
export class PhotosPage {
  private api = inject(ApiService);
  private ui = inject(Ui);
  private dialog = inject(MatDialog);

  readonly labels = STATUS_LABELS;
  readonly status = signal<PhotoStatus | ''>('pending');
  readonly items = signal<Photo[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(false);

  constructor() {
    this.load();
  }

  setStatus(s: PhotoStatus | ''): void {
    this.status.set(s);
    this.page.set(1);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.photos({ status: this.status(), page: this.page() }).subscribe({
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

  /** Replace or drop the card depending on the active filter. */
  private updated(p: Photo): void {
    if (this.status() && p.status !== this.status()) {
      this.items.update((l) => l.filter((x) => x.id !== p.id));
      this.total.update((t) => t - 1);
    } else {
      this.items.update((l) => l.map((x) => (x.id === p.id ? p : x)));
    }
  }

  approve(p: Photo): void {
    this.api.approvePhoto(p.id).subscribe({
      next: (u) => {
        this.updated(u);
        this.ui.toast('عکس تایید و منتشر شد');
      },
      error: (e) => this.ui.toast(errorMessage(e)),
    });
  }

  reject(p: Photo): void {
    this.ui
      .prompt({ title: 'رد عکس', label: 'دلیل رد (به کاربر نمایش داده می‌شود)', ok: 'رد عکس', multiline: true })
      .subscribe((r) => {
        if (!r) return;
        this.api.rejectPhoto(p.id, r.value.trim() || null).subscribe({
          next: (u) => {
            this.updated(u);
            this.ui.toast('عکس رد شد');
          },
          error: (e) => this.ui.toast(errorMessage(e)),
        });
      });
  }

  editTitle(p: Photo): void {
    this.ui.prompt({ title: 'ویرایش عنوان', label: 'عنوان', value: p.title }).subscribe((r) => {
      if (!r || !r.value.trim()) return;
      this.api.updatePhoto(p.id, { title: r.value.trim() }).subscribe({
        next: (u) => this.updated(u),
        error: (e) => this.ui.toast(errorMessage(e)),
      });
    });
  }

  remove(p: Photo): void {
    this.ui
      .confirm({ title: 'حذف عکس', message: `عکس «${p.title}» برای همیشه حذف شود؟`, ok: 'حذف', danger: true })
      .subscribe((ok) => {
        if (!ok) return;
        this.api.deletePhoto(p.id).subscribe({
          next: () => {
            this.items.update((l) => l.filter((x) => x.id !== p.id));
            this.total.update((t) => t - 1);
            this.ui.toast('عکس حذف شد');
          },
          error: (e) => this.ui.toast(errorMessage(e)),
        });
      });
  }

  blockUser(p: Photo): void {
    const u = p.user;
    if (!u) return;
    const block = !u.is_blocked;
    this.ui
      .confirm({
        title: block ? 'مسدود کردن کاربر' : 'رفع مسدودی',
        message: block
          ? `کاربر ${u.name ?? u.phone} دیگر نمی‌تواند عکس ارسال کند و از اپ خارج می‌شود. ادامه می‌دهید؟`
          : `کاربر ${u.name ?? u.phone} دوباره می‌تواند وارد شود و عکس ارسال کند.`,
        ok: block ? 'مسدود کن' : 'رفع مسدودی',
        danger: block,
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.api.setBlocked(u.id, block).subscribe({
          next: () => {
            this.items.update((l) =>
              l.map((x) => (x.user?.id === u.id ? { ...x, user: { ...x.user!, is_blocked: block } } : x)),
            );
            this.ui.toast(block ? 'کاربر مسدود شد' : 'مسدودی برداشته شد');
          },
          error: (e) => this.ui.toast(errorMessage(e)),
        });
      });
  }

  upload(): void {
    this.dialog
      .open(UploadDialog, { direction: 'rtl' })
      .afterClosed()
      .subscribe((p) => {
        if (!p) return;
        this.ui.toast('عکس به گالری اضافه شد');
        if (this.status() !== 'pending') this.load();
      });
  }
}
