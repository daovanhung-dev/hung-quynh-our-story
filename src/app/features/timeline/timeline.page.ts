import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MemoryService } from '../../core/services/memory.service';
import { TimelineComponent } from './timeline.component';

@Component({
  standalone: true,
  imports: [TimelineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-intro">
      <div class="intro-copy">
        <p class="eyebrow">Hùng ♡ Quỳnh · our story</p>
        <h1>Những ngày mình có nhau.</h1>
        <span>Đi chậm một chút, để từng khoảnh khắc nhỏ đưa mình trở về những ngày đã từng rất vui.</span>
      </div>
      <div class="intro-stats" aria-label="Tổng quan kỷ niệm">
        <span><strong>{{ memoryCount }}</strong> ngày</span>
        <span><strong>{{ monthCount }}</strong> tháng</span>
        <span>một câu chuyện</span>
      </div>
    </div>
    <app-timeline />
  `,
  styles: [`
    .page-intro { display: flex; align-items: end; justify-content: space-between; gap: 2rem; width: min(1180px, 90vw); margin: 0 auto; padding: clamp(3.5rem, 8vw, 7rem) 0 1rem; }
    .intro-copy { max-width: 780px; }
    .eyebrow { margin: 0 0 .8rem; color: var(--accent-deep); font-size: .72rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
    h1 { max-width: 850px; margin: 0; font-family: var(--font-display); font-size: clamp(3rem, 8vw, 7rem); font-weight: 400; line-height: .88; letter-spacing: -.065em; }
    .page-intro span { display: block; max-width: 650px; margin-top: 1.2rem; color: var(--text-secondary); line-height: 1.75; }
    .intro-stats { display: grid; gap: .55rem; min-width: 150px; padding: 1rem 0 .2rem 1.2rem; border-left: 1px solid var(--border); color: var(--text-muted); font-size: .76rem; line-height: 1.4; }
    .intro-stats strong { color: var(--accent-deep); font-family: var(--font-display); font-size: 1.8rem; font-weight: 400; }
    .intro-stats span { display: flex; align-items: baseline; gap: .35rem; }
    @media (max-width: 680px) {
      .page-intro { display: block; width: calc(100% - 2rem); padding-top: 3.2rem; }
      .intro-stats { display: flex; gap: 1rem; margin-top: 2rem; padding: 1rem 0 0; border-top: 1px solid var(--border); border-left: 0; }
      .intro-stats strong { font-size: 1.45rem; }
    }
  `]
})
export class TimelinePage {
  private readonly memoryService = inject(MemoryService);
  protected readonly memoryCount = this.memoryService.getAllMemories().length;
  protected readonly monthCount = this.memoryService.getMonthPhotoGroups().length;
}
