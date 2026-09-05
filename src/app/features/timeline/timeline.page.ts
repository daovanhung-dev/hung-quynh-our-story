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
        <p class="eyebrow">Hùng ♡ Quỳnh · photo diary</p>
        <h1>Những ngày mình có nhau.</h1>
        <span>Một cuốn lưu ký nhỏ, được kể bằng những bức ảnh mình đã cùng đi qua.</span>
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
    .page-intro { display: flex; align-items: end; justify-content: space-between; gap: 2rem; width: min(1240px, calc(100% - 3rem)); margin: 0 auto; padding: clamp(4rem, 10vw, 9rem) max(0px,env(safe-area-inset-right)) 1rem max(0px,env(safe-area-inset-left)); }
    .intro-copy { max-width: 780px; }
    .eyebrow { margin: 0 0 .8rem; color: var(--wine); font-size: .68rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
    h1 { max-width: 850px; margin: 0; font-family: var(--font-display); font-size: clamp(3rem, 8vw, 7rem); font-weight: 400; line-height: .91; letter-spacing: -.055em; }
    .page-intro span { display: block; max-width: 650px; margin-top: 1.2rem; color: var(--text-secondary); line-height: 1.75; }
    .intro-stats { display: grid; gap: .55rem; min-width: 150px; padding: 1rem 0 .2rem 1.2rem; border-left: 1px solid var(--border); color: var(--text-muted); font-size: .76rem; line-height: 1.4; }
    .intro-stats strong { color: var(--wine); font-family: var(--font-display); font-size: 1.8rem; font-weight: 400; }
    .intro-stats span { display: flex; align-items: baseline; gap: .35rem; }
    @media (max-width: 680px) {
      .page-intro { display: block; width: min(calc(100% - 2rem),560px); padding-top:3rem; }
      h1 { font-size:clamp(2.5rem,12vw,4.6rem); line-height:.9; }
      .page-intro span { line-height:1.65; }
      .intro-stats { display:flex; flex-wrap:wrap; gap:.65rem 1rem; margin-top:1.7rem; padding:1rem 0 0; border-top:1px solid var(--border); border-left:0; }
      .intro-stats strong { font-size: 1.45rem; }
    }
  `]
})
export class TimelinePage {
  private readonly memoryService = inject(MemoryService);
  protected readonly memoryCount = this.memoryService.getAllMemories().length;
  protected readonly monthCount = this.memoryService.getMonthMemoryGroups().length;
}
