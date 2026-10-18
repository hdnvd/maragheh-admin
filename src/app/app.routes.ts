import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage) },
      { path: 'news', loadComponent: () => import('./pages/news/news').then((m) => m.NewsPage) },
      { path: 'sources', loadComponent: () => import('./pages/sources/sources').then((m) => m.SourcesPage) },
      {
        path: 'attractions',
        data: { type: 'attraction' },
        loadComponent: () => import('./pages/posts/posts').then((m) => m.PostsPage),
      },
      {
        path: 'attractions/:id',
        data: { type: 'attraction' },
        loadComponent: () => import('./pages/post-edit/post-edit').then((m) => m.PostEditPage),
      },
      {
        path: 'celebrities',
        data: { type: 'celebrity' },
        loadComponent: () => import('./pages/posts/posts').then((m) => m.PostsPage),
      },
      {
        path: 'celebrities/:id',
        data: { type: 'celebrity' },
        loadComponent: () => import('./pages/post-edit/post-edit').then((m) => m.PostEditPage),
      },
      { path: 'photos', loadComponent: () => import('./pages/photos/photos').then((m) => m.PhotosPage) },
      { path: 'users', loadComponent: () => import('./pages/users/users').then((m) => m.UsersPage) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings').then((m) => m.SettingsPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
