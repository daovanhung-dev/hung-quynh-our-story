import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MemoryService } from '../../core/services/memory.service';
import { MonthPhotoRailComponent } from '../../shared/components/month-photo-rail/month-photo-rail.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [MonthPhotoRailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="timeline-wrap" aria-labelledby="timeline-title">
      <div class="section-heading">
        <p class="eyebrow">Dòng thời gian</p>
        <h2 id="timeline-title">Mỗi tháng là một thanh ảnh ngang để mình kéo, vuốt và nhìn lại từng ngày.</h2>
      </div>

      @if (groups.length === 0) {
        <div class="empty-state">
          <span aria-hidden="true">♡</span>
          <h3>Chúng mình vẫn còn rất nhiều kỷ niệm đang chờ được viết tiếp.</h3>
          <p>Hiện tại source ảnh đang được đính kèm dưới dạng file nén. Nếu muốn website hiển thị ảnh trực tiếp, hãy giải nén ảnh vào <code>public/images/memories/YYYY/MM/DD</code>.</p>
        </div>
      } @else {
        <div class="month-nav" aria-label="Đi nhanh tới tháng">
          @for (group of groups; track group.monthKey) {
            <a [href]="'#' + group.monthKey">{{ group.monthLabel }}</a>
          }
        </div>

        <div class="month-list">
          @for (group of groups; track group.monthKey) {
            <app-month-photo-rail [group]="group" />
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .timeline-wrap { width: min(1180px, 90vw); margin: 0 auto; padding: 4rem 0 2rem; }
    .section-heading { max-width: 920px; margin-bottom: 2rem; }
    .eyebrow { margin: 0 0 .65rem; color: var(--accent-deep); font-size: .78rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    h2 { margin: 0; font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 4.3rem); line-height: .98; letter-spacing: -.04em; }

    .month-nav {
      position: sticky;
      top: 64px;
      z-index: 4;
      display: flex;
      gap: .55rem;
      overflow-x: auto;
      margin-bottom: 1.8rem;
      padding: .75rem 0 1rem;
      background: linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, var(--background) 95%, transparent) 78%, transparent 100%);
      scrollbar-width: none;
    }
    .month-nav::-webkit-scrollbar { display: none; }
    .month-nav a {
      flex: 0 0 auto;
      padding: .56rem .85rem;
      border: 1px solid var(--border);
      border-radius: 999px;
      color: var(--text-secondary);
      text-decoration: none;
      background: color-mix(in srgb, var(--surface) 86%, transparent);
    }

    .month-list { display: grid; gap: 3rem; }

    .empty-state {
      display: grid;
      place-items: center;
      min-height: 320px;
      padding: 2rem 1rem;
      border: 1px dashed var(--border);
      border-radius: calc(var(--radius-xl) + 4px);
      text-align: center;
      background: color-mix(in srgb, var(--surface) 65%, transparent);
    }
    .empty-state span { color: var(--accent); font-size: 2rem; }
    .empty-state h3 { max-width: 620px; margin: .7rem 0; font-family: var(--font-display); font-size: clamp(1.5rem, 4vw, 2.3rem); }
    .empty-state p { margin: 0; color: var(--text-muted); line-height: 1.7; }
    code { padding: .15rem .35rem; border-radius: 8px; background: var(--surface-muted); font-size: .84em; }

    @media (max-width: 760px) {
      .timeline-wrap { width: calc(100% - 2rem); padding-top: 3rem; }
      .month-nav { top: 62px; }
    }
  `]
})
export class TimelineComponent {
  private readonly memoryService = inject(MemoryService);
  protected readonly groups = this.memoryService.getMonthPhotoGroups();
}
