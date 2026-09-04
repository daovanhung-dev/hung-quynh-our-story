import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <span>404 · ♡</span>
      <h1>Trang này không nằm trong cuốn lưu ký của chúng mình.</h1>
      <a routerLink="/">Về trang đầu</a>
    </section>
  `,
  styles: [`
    section { display: grid; place-items: center; align-content: center; min-height: 72dvh; padding: 2rem; text-align: center; }
    span { color: var(--accent-deep); font-weight: 800; }
    h1 { max-width: 820px; margin: 1rem 0 1.5rem; font-family: var(--font-display); font-size: clamp(2.4rem, 7vw, 5.7rem); line-height: .98; letter-spacing: -.04em; }
    a { color: var(--accent-deep); }
  `]
})
export class NotFoundPage {}
