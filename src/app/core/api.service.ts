import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppUser, Dashboard, News, Paged, Photo, PhotoStatus, Post, PostType, Source } from './models';

type Query = Record<string, string | number | boolean | null | undefined>;

function params(q: Query): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
  }
  return p;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;

  // dashboard / account
  dashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.base}/dashboard`);
  }
  changePassword(body: { current_password: string; password: string; password_confirmation: string }) {
    return this.http.put<{ message: string }>(`${this.base}/password`, body);
  }

  // news
  news(q: Query): Observable<Paged<News>> {
    return this.http.get<Paged<News>>(`${this.base}/news`, { params: params(q) });
  }
  newsDetail(id: number): Observable<News> {
    return this.http.get<{ data: News }>(`${this.base}/news/${id}`).pipe(map((r) => r.data));
  }
  updateNews(id: number, body: Partial<Pick<News, 'is_visible' | 'title' | 'summary'>>): Observable<News> {
    return this.http.patch<{ data: News }>(`${this.base}/news/${id}`, body).pipe(map((r) => r.data));
  }

  // sources
  sources(): Observable<Source[]> {
    return this.http.get<{ data: Source[] }>(`${this.base}/sources`).pipe(map((r) => r.data));
  }
  saveSource(s: Partial<Source>): Observable<Source> {
    const req = s.id
      ? this.http.put<{ data: Source }>(`${this.base}/sources/${s.id}`, s)
      : this.http.post<{ data: Source }>(`${this.base}/sources`, s);
    return req.pipe(map((r) => r.data));
  }
  deleteSource(id: number) {
    return this.http.delete(`${this.base}/sources/${id}`);
  }
  crawl(id: number) {
    return this.http.post<{ message: string; added: number; source: Source }>(`${this.base}/sources/${id}/crawl`, {});
  }

  // posts
  posts(type: PostType, q: Query): Observable<Paged<Post>> {
    return this.http.get<Paged<Post>>(`${this.base}/posts`, { params: params({ ...q, type }) });
  }
  post(id: number): Observable<Post> {
    return this.http.get<{ data: Post }>(`${this.base}/posts/${id}`).pipe(map((r) => r.data));
  }
  savePost(id: number | null, form: FormData): Observable<Post> {
    const url = id ? `${this.base}/posts/${id}` : `${this.base}/posts`;
    return this.http.post<{ data: Post }>(url, form).pipe(map((r) => r.data));
  }
  updatePost(id: number, body: Partial<Post>): Observable<Post> {
    return this.http.put<{ data: Post }>(`${this.base}/posts/${id}`, body).pipe(map((r) => r.data));
  }
  deletePost(id: number) {
    return this.http.delete(`${this.base}/posts/${id}`);
  }
  addPostImages(id: number, files: File[]): Observable<Post> {
    const fd = new FormData();
    files.forEach((f) => fd.append('images[]', f));
    return this.http.post<{ data: Post }>(`${this.base}/posts/${id}/images`, fd).pipe(map((r) => r.data));
  }
  deletePostImage(postId: number, imageId: number): Observable<Post> {
    return this.http.delete<{ data: Post }>(`${this.base}/posts/${postId}/images/${imageId}`).pipe(map((r) => r.data));
  }

  // photos
  photos(q: { status?: PhotoStatus | ''; page?: number; app_user_id?: number }): Observable<Paged<Photo>> {
    return this.http.get<Paged<Photo>>(`${this.base}/photos`, { params: params(q) });
  }
  uploadPhoto(fd: FormData): Observable<Photo> {
    return this.http.post<{ data: Photo }>(`${this.base}/photos`, fd).pipe(map((r) => r.data));
  }
  updatePhoto(id: number, body: { title?: string; description?: string | null }): Observable<Photo> {
    return this.http.patch<{ data: Photo }>(`${this.base}/photos/${id}`, body).pipe(map((r) => r.data));
  }
  approvePhoto(id: number): Observable<Photo> {
    return this.http.post<{ data: Photo }>(`${this.base}/photos/${id}/approve`, {}).pipe(map((r) => r.data));
  }
  rejectPhoto(id: number, reason: string | null): Observable<Photo> {
    return this.http.post<{ data: Photo }>(`${this.base}/photos/${id}/reject`, { reason }).pipe(map((r) => r.data));
  }
  deletePhoto(id: number) {
    return this.http.delete(`${this.base}/photos/${id}`);
  }

  // app users
  appUsers(q: Query): Observable<Paged<AppUser>> {
    return this.http.get<Paged<AppUser>>(`${this.base}/app-users`, { params: params(q) });
  }
  setBlocked(id: number, blocked: boolean): Observable<AppUser> {
    return this.http
      .patch<{ data: AppUser }>(`${this.base}/app-users/${id}`, { is_blocked: blocked })
      .pipe(map((r) => r.data));
  }
}
