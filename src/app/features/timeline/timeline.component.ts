import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MemoryService } from '../../core/services/memory.service';
import type { MemoryMedia } from '../../core/models/memory.model';
import { MonthPhotoRailComponent } from '../../shared/components/month-photo-rail/month-photo-rail.component';
import { PhotoViewerComponent } from '../../shared/components/photo-viewer/photo-viewer.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [MonthPhotoRailComponent, PhotoViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="timeline-wrap" aria-labelledby="timeline-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Mở từng chương</p>
          <h2 id="timeline-title">Mỗi tháng giữ lại một chút dịu dàng của chúng mình.</h2>
        </div>
        <p class="section-note">Kéo sang ngang hoặc chạm vào một tấm ảnh để xem trọn vẹn ngày hôm đó.</p>
      </div>

      @if (groups.length === 0 && unresolvedGroups.length === 0) {
        <div class="empty-state">
          <span aria-hidden="true">♡</span>
          <h3>Chúng mình vẫn còn rất nhiều kỷ niệm đang chờ được viết tiếp.</h3>
          <p>Hiện tại source ảnh đang được đính kèm dưới dạng file nén. Nếu muốn website hiển thị ảnh trực tiếp, hãy giải nén ảnh vào <code>public/images/memories/YYYY/MM/DD</code>.</p>
        </div>
      } @else {
        @if (groups.length > 0) {
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

        @if (unresolvedGroups.length > 0) {
          <section class="additional-media" aria-labelledby="additional-media-title">
            <div class="additional-heading">
              <p class="eyebrow">Ảnh thêm</p>
              <h3 id="additional-media-title">Những media chưa xác định được ngày chụp.</h3>
              <p>Giữ nguyên trong một mục riêng để không gán ngày giả cho kỷ niệm.</p>
            </div>

            @for (group of unresolvedGroups; track group.sourceMonth) {
              <div class="additional-group">
                <h4>{{ group.label }}</h4>
                <div class="additional-grid">
                  @for (media of group.media; track media.id; let index = $index) {
                    <button type="button" class="additional-card" (click)="openUnresolvedViewer(group.media, index)" [attr.aria-label]="'Mở media chưa xác định ngày ' + (index + 1)">
                      @if (media.kind === 'video') {
                        <video [src]="media.src" [poster]="media.posterSrc" muted playsinline preload="none" aria-hidden="true"></video>
                      } @else {
                        <img [src]="media.thumbnailSrc || media.src" [alt]="media.alt || 'Media chưa xác định ngày'" loading="lazy" decoding="async">
                      }
                      <span>{{ media.kind === 'video' ? 'Video' : 'Ảnh' }}</span>
                    </button>
                  }
                </div>
              </div>
            }
          </section>
        }
      }
    </section>

    @if (viewerOpen) {
      <app-photo-viewer [images]="viewerMedia" [initialIndex]="viewerIndex" (closed)="closeViewer()" />
    }
  `,
  styles: [`
    .timeline-wrap { width: min(1180px, 90vw); margin: 0 auto; padding: 4rem 0 2rem; }
    .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; max-width: 1000px; margin-bottom: 2.4rem; }
    .eyebrow { margin: 0 0 .65rem; color: var(--accent-deep); font-size: .72rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
    h2 { max-width: 800px; margin: 0; font-family: var(--font-display); font-size: clamp(2.4rem, 5.5vw, 4.8rem); font-weight: 400; line-height: .92; letter-spacing: -.055em; }
    .section-note { max-width: 230px; margin: 0; color: var(--text-muted); font-size: .78rem; line-height: 1.6; }

    .month-nav {
      position: sticky;
      top: 64px;
      z-index: 4;
      display: flex;
      gap: .55rem;
      overflow-x: auto;
      margin-bottom: 2.4rem;
      padding: .75rem 0 1rem;
      background: linear-gradient(180deg, color-mix(in srgb, var(--background) 98%, transparent) 0%, color-mix(in srgb, var(--background) 92%, transparent) 78%, transparent 100%);
      scrollbar-width: none;
    }
    .month-nav::-webkit-scrollbar { display: none; }
    .month-nav a {
      flex: 0 0 auto;
      padding: .56rem .85rem;
      border: 1px solid rgba(143, 81, 93, .16);
      border-radius: 999px;
      color: var(--text-secondary);
      text-decoration: none;
      background: rgba(255,250,242,.78);
      transition: color 180ms ease, background 180ms ease, transform 180ms ease;
    }
    .month-nav a:hover, .month-nav a:focus-visible { color: var(--accent-deep); background: var(--surface); transform: translateY(-2px); }

    .month-list { display: grid; gap: 3rem; }

    .additional-media {
      display: grid;
      gap: 1.7rem;
      margin-top: 4rem;
      padding: 3.5rem 0 1rem;
      border-top: 1px solid var(--border);
    }

    .additional-heading { max-width: 760px; }
    .additional-heading h3 { margin: 0; font-family: var(--font-display); font-size: clamp(2.1rem, 5vw, 4rem); font-weight: 400; line-height: .92; letter-spacing: -.05em; }
    .additional-heading p:last-child { margin: .9rem 0 0; color: var(--text-secondary); line-height: 1.7; }
    .additional-group { display: grid; gap: .9rem; }
    .additional-group h4 { margin: 0; color: var(--accent-deep); font-size: 1rem; }
    .additional-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1rem; }
    .additional-card { display: grid; gap: .55rem; min-width: 0; padding: .55rem; border: 1px solid var(--border); border-radius: var(--radius-xl); background: rgba(255,250,242,.82); color: inherit; text-align: left; cursor: zoom-in; box-shadow: var(--shadow-soft); transition: transform 220ms var(--ease-soft), box-shadow 220ms var(--ease-soft); }
    .additional-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(89,53,48,.14); }
    .additional-card img, .additional-card video { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 14px; background: var(--surface-muted); }
    .additional-card span { color: var(--text-muted); font-size: .78rem; }

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
      .section-heading { display: block; }
      .section-note { max-width: 360px; margin-top: 1rem; }
      .month-nav { top: 62px; }
      .additional-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `]
})
export class TimelineComponent {
  private readonly memoryService = inject(MemoryService);
  protected readonly groups = this.memoryService.getMonthPhotoGroups();
  protected readonly unresolvedGroups = this.memoryService.getUnresolvedMediaGroups();
  protected viewerOpen = false;
  protected viewerIndex = 0;
  protected viewerMedia: readonly MemoryMedia[] = [];

  protected openUnresolvedViewer(media: readonly MemoryMedia[], index: number): void {
    this.viewerMedia = media;
    this.viewerIndex = index;
    this.viewerOpen = true;
  }

  protected closeViewer(): void {
    this.viewerOpen = false;
  }
}
