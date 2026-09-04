import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SITE_CONFIG } from './core/constants/site.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="site-header">
      <a class="brand" routerLink="/" aria-label="Về trang chủ">{{ site.title }}</a>
      <nav aria-label="Điều hướng chính">
        <a routerLink="/" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">Trang chủ</a>
        <a routerLink="/timeline" routerLinkActive="is-active">Dòng thời gian</a>
      </nav>
    </header>

    <main>
      <router-outlet />
    </main>

    <footer class="site-footer">
      <span>{{ site.footerText }}</span>
    </footer>
  `,
  styles: [`
    :host { display: block; min-height: 100dvh; }

    .site-header {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-height: 64px;
      padding: 0 5vw;
      border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 8%, transparent);
      background: color-mix(in srgb, var(--background) 84%, transparent);
      backdrop-filter: blur(16px);
    }

    .brand {
      color: var(--text-primary);
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      text-decoration: none;
    }

    nav { display: flex; align-items: center; gap: .5rem; }
    nav a {
      display: inline-flex;
      align-items: center;
      min-height: 38px;
      padding: 0 .85rem;
      border-radius: 999px;
      color: var(--text-secondary);
      font-size: .9rem;
      text-decoration: none;
    }
    nav a:hover, nav a.is-active {
      color: var(--accent-deep);
      background: color-mix(in srgb, var(--surface) 86%, transparent);
    }

    .site-footer {
      display: flex;
      justify-content: center;
      padding: 4rem 1.5rem 3rem;
      color: var(--text-muted);
      font-size: .85rem;
      text-align: center;
    }

    @media (max-width: 640px) {
      .site-header { padding-inline: 1rem; }
      nav { gap: .2rem; }
      nav a { font-size: .8rem; padding-inline: .6rem; }
    }
  `]
})
export class AppComponent {
  protected readonly site = SITE_CONFIG;
}
