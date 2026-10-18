import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { Dashboard } from '../../core/models';
import { FaPipe } from '../../shared/fa';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatIconModule, MatButtonModule, MatProgressBarModule, FaPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private api = inject(ApiService);

  readonly data = signal<Dashboard | null>(null);
  readonly error = signal<string | null>(null);
  readonly maxPerDay = computed(() => Math.max(1, ...(this.data()?.news_per_day.map((d) => d.count) ?? [1])));

  constructor() {
    this.load();
  }

  load(): void {
    this.error.set(null);
    this.api.dashboard().subscribe({
      next: (d) => this.data.set(d),
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}
