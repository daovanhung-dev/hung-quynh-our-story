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
        <a class="brand" routerLink="/" aria-label="Về món quà sinh nhật dành cho Quỳnh">
          <span class="brand-mark" aria-hidden="true">H ♡ Q</span>
          <span>Happy Birthday, My Love</span>
        </a>
        <nav aria-label="Điều hướng món quà">
          <a routerLink="/" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">Món quà</a>
          <a routerLink="/timeline" routerLinkActive="is-active">Kỷ niệm</a>
          <a routerLink="/birthday" routerLinkActive="is-active">Xem lại từ đầu</a>
        </nav>
      </div>
    </header>

    <main id="main-content" tabindex="-1"><router-outlet /></main>

    <footer class="site-footer" [class.journey-hidden]="journey.active()">
      <span class="footer-mark" aria-hidden="true">H ♡ Q</span>
      <span>{{ site.footerText }}</span>
      <span class="footer-note">— Hùng · 05.09.2026</span>
    </footer>
  `,
  styles: [`
    :host { display:block; min-height:100dvh; }
    .site-header { position:sticky; top:0; z-index:50; border-bottom:1px solid var(--border); background:rgba(248,244,238,.94); backdrop-filter:blur(14px); padding-inline:max(0px,env(safe-area-inset-left)) max(0px,env(safe-area-inset-right)); transition:opacity 180ms var(--ease-out),visibility 180ms var(--ease-out); }
    .masthead { display:flex; align-items:center; justify-content:space-between; gap:1.5rem; width:min(1320px,calc(100% - 3rem)); min-height:72px; margin:0 auto; }
    .journey-hidden { visibility:hidden; opacity:0; pointer-events:none; }
    .brand { display:inline-flex; align-items:baseline; gap:.72rem; min-height:44px; color:var(--ink); font-family:var(--font-display); font-size:1rem; font-weight:400; letter-spacing:-.02em; text-decoration:none; white-space:nowrap; }
    .brand-mark { color:var(--wine); font-family:var(--font-body); font-size:.68rem; font-weight:600; letter-spacing:.13em; }
    nav { display:flex; align-items:center; gap:.25rem; }
    nav a { display:inline-flex; align-items:center; justify-content:center; min-height:44px; padding:0 .75rem; border-bottom:1px solid transparent; color:var(--text-secondary); font-size:.7rem; font-weight:600; letter-spacing:.06em; text-decoration:none; text-transform:uppercase; transition:color 180ms var(--ease-out),border-color 180ms var(--ease-out); }
    nav a:hover,nav a.is-active { border-color:var(--wine); color:var(--wine); }
    main:focus { outline:none; }
    .site-footer { display:flex; flex-wrap:wrap; justify-content:center; align-items:center; gap:.65rem 1rem; padding:5rem max(1.5rem,env(safe-area-inset-right)) max(2.8rem,env(safe-area-inset-bottom)) max(1.5rem,env(safe-area-inset-left)); background:var(--paper); color:var(--text-muted); font-size:.72rem; letter-spacing:.03em; text-align:center; transition:opacity 180ms var(--ease-out),visibility 180ms var(--ease-out); }
    .footer-mark { color:var(--wine); font-weight:600; letter-spacing:.12em; }
    .footer-note { color:var(--text-secondary); }
    @media (max-width:680px) {
      .masthead { display:grid; gap:0; width:min(calc(100% - 2rem),560px); min-height:0; padding:.65rem 0 0; }
      .brand { min-width:0; min-height:40px; gap:.55rem; font-size:.92rem; }
      .brand-mark { flex:0 0 auto; font-size:.62rem; }
      nav { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid var(--border); }
      nav a { min-width:0; min-height:48px; padding:0 .2rem; font-size:.62rem; line-height:1.2; text-align:center; }
    }
  `]
})
export class AppComponent {
  protected readonly journey = inject(BirthdayJourneyService);
  protected readonly site = SITE_CONFIG;
}
