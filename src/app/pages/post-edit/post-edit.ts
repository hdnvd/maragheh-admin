import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { POST_LABELS, Post, PostType } from '../../core/models';
import { Ui } from '../../shared/dialogs';
import { RichEditor } from '../../shared/rich-editor';

@Component({
  selector: 'app-post-edit',
  imports: [
    ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatSlideToggleModule, MatProgressBarModule, MatTooltipModule, RichEditor,
  ],
  templateUrl: './post-edit.html',
  styleUrl: './post-edit.scss',
})
export class PostEditPage {
  private api = inject(ApiService);
  private ui = inject(Ui);
  private router = inject(Router);

  /** route param (":id" — "new" or a number) and route data ("type") */
  readonly id = input<string>('new');
  readonly type = input.required<PostType>();

  readonly labels = computed(() => POST_LABELS[this.type()]);
  readonly listPath = computed(() => (this.type() === 'attraction' ? '/attractions' : '/celebrities'));
  readonly isNew = computed(() => this.id() === 'new');

  readonly post = signal<Post | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly coverPreview = signal<string | null>(null);
  private coverFile: File | null = null;
  private removeCover = false;

  readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    subtitle: [''],
    summary: [''],
    body: [''],
    latitude: [''],
    longitude: [''],
    sort_order: [0],
    is_published: [true],
  });

  ngOnInit(): void {
    if (!this.isNew()) this.load(+this.id());
  }

  private load(id: number): void {
    this.loading.set(true);
    this.api.post(id).subscribe({
      next: (p) => {
        this.loading.set(false);
        this.apply(p);
      },
      error: (e) => {
        this.loading.set(false);
        this.ui.toast(errorMessage(e));
      },
    });
  }

  private apply(p: Post): void {
    this.post.set(p);
    this.coverPreview.set(p.cover);
    this.form.reset({
      title: p.title,
      subtitle: p.subtitle ?? '',
      summary: p.summary ?? '',
      body: p.body ?? '',
      latitude: p.latitude?.toString() ?? '',
      longitude: p.longitude?.toString() ?? '',
      sort_order: p.sort_order,
      is_published: p.is_published,
    });
  }

  pickCover(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.coverFile = file;
    this.removeCover = false;
    this.coverPreview.set(URL.createObjectURL(file));
  }

  clearCover(): void {
    this.coverFile = null;
    this.removeCover = true;
    this.coverPreview.set(null);
  }

  /** Accepts "37.39, 46.23" pasted from a map app into the latitude field. */
  splitCoords(): void {
    const v = this.form.controls.latitude.value;
    const m = v.match(/(-?\d+(?:\.\d+)?)\s*[,،\s]\s*(-?\d+(?:\.\d+)?)/);
    if (m) this.form.patchValue({ latitude: m[1], longitude: m[2] });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.append('type', this.type());
    fd.append('title', v.title);
    fd.append('subtitle', v.subtitle);
    fd.append('summary', v.summary);
    fd.append('body', v.body);
    fd.append('latitude', this.type() === 'attraction' ? v.latitude.trim() : '');
    fd.append('longitude', this.type() === 'attraction' ? v.longitude.trim() : '');
    fd.append('sort_order', String(v.sort_order ?? 0));
    fd.append('is_published', v.is_published ? '1' : '0');
    if (this.coverFile) fd.append('cover', this.coverFile);
    if (this.removeCover) fd.append('remove_cover', '1');

    this.saving.set(true);
    const id = this.post()?.id ?? null;
    this.api.savePost(id, fd).subscribe({
      next: (p) => {
        this.saving.set(false);
        this.coverFile = null;
        this.removeCover = false;
        this.ui.toast('ذخیره شد');
        if (!id) {
          this.router.navigate([this.listPath(), p.id], { replaceUrl: true });
          this.apply(p);
        } else {
          this.apply(p);
        }
      },
      error: (e) => {
        this.saving.set(false);
        this.ui.toast(errorMessage(e));
      },
    });
  }

  addImages(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const p = this.post();
    if (!files.length || !p) return;
    this.uploading.set(true);
    this.api.addPostImages(p.id, files).subscribe({
      next: (u) => {
        this.uploading.set(false);
        this.post.set(u);
        input.value = '';
      },
      error: (err) => {
        this.uploading.set(false);
        input.value = '';
        this.ui.toast(errorMessage(err));
      },
    });
  }

  deleteImage(imageId: number): void {
    const p = this.post();
    if (!p) return;
    this.ui.confirm({ title: 'حذف تصویر', message: 'این تصویر از گالری حذف شود؟', ok: 'حذف', danger: true }).subscribe((ok) => {
      if (!ok) return;
      this.api.deletePostImage(p.id, imageId).subscribe({
        next: (u) => this.post.set(u),
        error: (e) => this.ui.toast(errorMessage(e)),
      });
    });
  }
}
