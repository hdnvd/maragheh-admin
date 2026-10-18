import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { FaPipe } from '../shared/fa';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule, FaPipe,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private api = inject(ApiService);
  private router = inject(Router);
  readonly auth = inject(AuthService);

  readonly mobile = toSignal(
    inject(BreakpointObserver).observe('(max-width: 960px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );
  readonly pending = signal(0);

  readonly nav: NavItem[] = [
    { path: '/', label: 'داشبورد', icon: 'dashboard', exact: true },
    { path: '/news', label: 'اخبار مراغه', icon: 'newspaper' },
    { path: '/sources', label: 'منابع خبری', icon: 'rss_feed' },
    { path: '/attractions', label: 'جاذبه‌های گردشگری', icon: 'landscape' },
    { path: '/celebrities', label: 'مشاهیر', icon: 'workspace_premium' },
    { path: '/photos', label: 'تصاویر مراغه', icon: 'photo_library' },
    { path: '/users', label: 'کاربران اپلیکیشن', icon: 'group' },
  ];

  constructor() {
    this.refreshPending();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.refreshPending());
  }

  private refreshPending(): void {
    this.api.photos({ status: 'pending' }).subscribe({
      next: (r) => this.pending.set(r.meta.total),
      error: () => {},
    });
  }
}
