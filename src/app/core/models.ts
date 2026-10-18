export interface Paged<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export interface Admin {
  id: number;
  name: string;
  email: string;
}

export interface Source {
  id: number;
  name: string;
  type: 'mehr_tag' | 'rss';
  url: string;
  keyword: string | null;
  max_pages: number;
  is_active: boolean;
  last_crawled_at: string | null;
  last_crawled_at_fa: string | null;
  last_error: string | null;
  news_count: number | null;
}

export interface News {
  id: number;
  title: string;
  summary: string | null;
  image: string | null;
  url: string;
  source?: { id: number; name: string };
  published_at: string;
  published_at_fa: string;
  body_html?: string;
  is_visible: boolean;
}

export type PostType = 'attraction' | 'celebrity';

export interface Post {
  id: number;
  type: PostType;
  title: string;
  subtitle: string | null;
  summary: string | null;
  body: string | null;
  cover: string | null;
  latitude: number | null;
  longitude: number | null;
  sort_order: number;
  is_published: boolean;
  gallery?: { id: number; url: string }[];
  updated_at: string;
}

export type PhotoStatus = 'pending' | 'approved' | 'rejected';

export interface Photo {
  id: number;
  title: string;
  description: string | null;
  image: string;
  thumb: string;
  width: number;
  height: number;
  sender: string;
  status: PhotoStatus;
  reject_reason: string | null;
  created_at_fa: string;
  created_at_full_fa: string;
  reviewed_at_fa: string | null;
  reviewer: string | null;
  user: { id: number; name: string; phone: string; is_blocked: boolean } | null;
}

export interface AppUser {
  id: number;
  name: string | null;
  phone: string;
  is_blocked: boolean;
  photos_count: number;
  last_login_at_fa: string | null;
  created_at_fa: string;
}

export interface Dashboard {
  news_total: number;
  news_today: number;
  attractions: number;
  celebrities: number;
  photos_approved: number;
  photos_pending: number;
  app_users: number;
  news_per_day: { label: string; count: number }[];
  sources: Source[];
}

export const POST_LABELS: Record<PostType, { plural: string; single: string; icon: string }> = {
  attraction: { plural: 'جاذبه‌های گردشگری', single: 'جاذبه گردشگری', icon: 'landscape' },
  celebrity: { plural: 'مشاهیر', single: 'مشاهیر', icon: 'workspace_premium' },
};

export const STATUS_LABELS: Record<PhotoStatus, string> = {
  pending: 'در انتظار بررسی',
  approved: 'تایید شده',
  rejected: 'رد شده',
};
