import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TimelineComponent } from './timeline.component';

@Component({
  standalone: true,
  imports: [TimelineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-intro">
      <p>Hùng ♡ Quỳnh</p>
      <h1>Dòng thời gian theo tháng</h1>
      <span>Ảnh được chia theo từng tháng, hiển thị trên các thanh ngang có thể kéo, vuốt và bấm điều hướng.</span>
    </div>
    <app-timeline />
  `,
  styles: [`
    .page-intro { width: min(1180px, 90vw); margin: 0 auto; padding: 4rem 0 0; }
    .page-intro p { margin: 0 0 .6rem; color: var(--accent-deep); font-weight: 700; }
    h1 { max-width: 850px; margin: 0; font-family: var(--font-display); font-size: clamp(2.7rem, 7vw, 6rem); line-height: .95; letter-spacing: -.045em; }
    .page-intro span { display: block; max-width: 760px; margin-top: 1rem; color: var(--text-secondary); line-height: 1.7; }
  `]
})
export class TimelinePage {}
