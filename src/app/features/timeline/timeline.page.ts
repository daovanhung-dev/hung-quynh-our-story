import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TimelineComponent } from './timeline.component';

@Component({
  standalone: true,
  imports: [TimelineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-intro">
      <div class="intro-copy">
        <p class="eyebrow">Hùng ♡ Quỳnh</p>
        <h1>Những ngày mình có nhau.</h1>
        <span>Một vài ngày mình muốn nhớ.</span>
      </div>
    </div>
    <app-timeline />
  `,
  styles: [`
    .page-intro { display: flex; align-items: end; justify-content: space-between; gap: 2rem; width: min(1240px, calc(100% - 3rem)); margin: 0 auto; padding: clamp(4rem, 10vw, 9rem) max(0px,env(safe-area-inset-right)) 1rem max(0px,env(safe-area-inset-left)); }
    .intro-copy { max-width: 780px; }
    .eyebrow { margin: 0 0 .8rem; color: var(--wine); font-size: .68rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
    h1 { max-width: 850px; margin: 0; font-family: var(--font-display); font-size: clamp(3rem, 8vw, 7rem); font-weight: 400; line-height: .91; letter-spacing: -.055em; }
    .page-intro span { display: block; max-width: 650px; margin-top: 1.2rem; color: var(--text-secondary); line-height: 1.75; }
    @media (max-width: 680px) {
      .page-intro { display: block; width: min(calc(100% - 2rem),560px); padding-top:3rem; }
      h1 { font-size:clamp(2.5rem,12vw,4.6rem); line-height:.9; }
      .page-intro span { line-height:1.65; }
    }
  `]
})
export class TimelinePage {
}
