import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SITE_CONFIG } from './core/constants/site.config';
import { BirthdayJourneyService } from './core/services/birthday-journey.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="site-header"
      [class.journey-hidden]="journey.active()"
      [attr.aria-hidden]="journey.active() ? 'true' : null"
      [attr.inert]="journey.active() ? '' : null"
    >
      <a class="brand" routerLink="/" aria-label="Về trang chủ">{{ site.title }}</a>
      <nav aria-label="Điều hướng chính">
        <a routerLink="/" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">Trang chủ</a>
        <a routerLink="/timeline" routerLinkActive="is-active">Dòng thời gian</a>
        <a routerLink="/birthday" routerLinkActive="is-active">Lời chúc</a>
      </nav>
    </header>

    <main>
      <router-outlet />
    </main>

    <footer
      class="site-footer"
      [class.journey-hidden]="journey.active()"
      [attr.aria-hidden]="journey.active() ? 'true' : null"
      [attr.inert]="journey.active() ? '' : null"
    >
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
      min-height: 70px;
      padding: 0 max(1rem, 5vw);
      border-bottom: 1px solid rgba(93, 63, 58, .11);
      background: rgba(255, 250, 243, .8);
      backdrop-filter: blur(16px);
      transition: opacity 260ms ease, visibility 260ms ease;
    }

    .journey-hidden { opacity: 0; visibility: hidden; pointer-events: none; }

    .brand {
      color: var(--text-primary);
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 700;
      text-decoration: none;
    }

    nav { display: flex; align-items: center; gap: .2rem; }
    nav a {
      display: inline-flex;
      align-items: center;
      min-height: 40px;
      padding: 0 .78rem;
      border-radius: 999px;
      color: var(--text-secondary);
      font-size: .78rem;
      font-weight: 700;
      letter-spacing: .03em;
      text-decoration: none;
      transition: color 180ms ease, background 180ms ease;
    }
    nav a:hover, nav a.is-active {
      color: var(--accent-deep);
      background: rgba(185, 120, 130, .1);
    }

    .site-footer {
      display: flex;
      justify-content: center;
      padding: 5rem 1.5rem 3rem;
      color: var(--text-muted);
      font-size: .78rem;
      text-align: center;
    }

    @media (max-width: 640px) {
      .site-header { padding-inline: 1rem; }
      nav { gap: .2rem; }
      nav a { font-size: .7rem; padding-inline: .45rem; }
    }
  `]
})
export class AppComponent {
  protected readonly journey = inject(BirthdayJourneyService);
  protected readonly site = SITE_CONFIG;
}
