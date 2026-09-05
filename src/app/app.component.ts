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
    <a class="skip-link" href="#main-content">Đi tới nội dung chính</a>

    <header class="site-header" [class.journey-hidden]="journey.active()">
      <div class="masthead">
        <a class="brand" routerLink="/" aria-label="Về trang chủ Hùng và Quỳnh">
          <span class="brand-mark" aria-hidden="true">H ♡ Q</span>
          <span>{{ site.title }}</span>
        </a>
        <nav aria-label="Điều hướng chính">
          <a routerLink="/" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">Trang chủ</a>
          <a routerLink="/timeline" routerLinkActive="is-active">Dòng thời gian</a>
          <a routerLink="/birthday" routerLinkActive="is-active">Lời nhắn</a>
        </nav>
      </div>
    </header>

    <main id="main-content" tabindex="-1"><router-outlet /></main>

    <footer class="site-footer" [class.journey-hidden]="journey.active()">
      <span class="footer-mark" aria-hidden="true">H ♡ Q</span>
      <span>{{ site.footerText }}</span>
      <span class="footer-note">Một cuốn lưu ký riêng tư</span>
    </footer>
  `,
  styles: [`
    :host { display: block; min-height: 100dvh; }
    .site-header { position: sticky; top: 0; z-index: 50; border-bottom: 1px solid var(--border); background: rgba(248,244,238,.96); transition: opacity 180ms var(--ease-out), visibility 180ms var(--ease-out); }
    .masthead { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; width: min(1320px, calc(100% - 3rem)); min-height: 72px; margin: 0 auto; }
    .journey-hidden { visibility: hidden; opacity: 0; pointer-events: none; }
    .brand { display: inline-flex; align-items: baseline; gap: .72rem; min-height: 44px; color: var(--ink); font-family: var(--font-display); font-size: 1.05rem; font-weight: 400; letter-spacing: -.02em; text-decoration: none; white-space: nowrap; }
    .brand-mark { color: var(--wine); font-family: var(--font-body); font-size: .68rem; font-weight: 600; letter-spacing: .13em; }
    nav { display: flex; align-items: center; gap: .25rem; }
    nav a { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 .75rem; border-bottom: 1px solid transparent; color: var(--text-secondary); font-size: .73rem; font-weight: 600; letter-spacing: .06em; text-decoration: none; text-transform: uppercase; transition: color 180ms var(--ease-out), border-color 180ms var(--ease-out); }
    nav a:hover, nav a.is-active { border-color: var(--wine); color: var(--wine); }
    main:focus { outline: none; }
    .site-footer { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: .65rem 1rem; padding: 5rem 1.5rem 2.5rem; color: var(--text-muted); font-size: .72rem; letter-spacing: .03em; text-align: center; transition: opacity 180ms var(--ease-out), visibility 180ms var(--ease-out); }
    .footer-mark { color: var(--wine); font-weight: 600; letter-spacing: .12em; }
    .footer-note { color: var(--text-secondary); }
    @media (max-width: 620px) {
      .masthead { display: grid; gap: 0; width: min(100% - 2rem, 560px); padding: .65rem 0 0; }
      .brand { min-height: 38px; }
      nav { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--border); }
      nav a { padding: 0 .25rem; font-size: .66rem; }
    }
  `]
})
export class AppComponent {
  protected readonly journey = inject(BirthdayJourneyService);
  protected readonly site = SITE_CONFIG;
}
