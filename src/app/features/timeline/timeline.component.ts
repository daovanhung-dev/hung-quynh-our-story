import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { MemoryMedia } from '../../core/models/memory.model';
import { MemoryService } from '../../core/services/memory.service';
import { MemoryCardComponent } from '../../shared/components/memory-card/memory-card.component';
import { MediaFrameComponent } from '../../shared/components/media-frame/media-frame.component';
import { PhotoViewerComponent } from '../../shared/components/photo-viewer/photo-viewer.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [MemoryCardComponent, MediaFrameComponent, PhotoViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="timeline-wrap" aria-labelledby="timeline-title">
      <header class="section-heading">
        <div>
          <p class="eyebrow">Những chương nhỏ</p>
          <h2 id="timeline-title">Mỗi ngày đã qua,<br>một lần mình ở bên nhau.</h2>
        </div>
        <p class="section-note">Không cần phải nhớ hết. Chỉ cần một tấm ảnh cũng đủ đưa mình về lại một ngày đẹp trời.</p>
      </header>

      @if (groups.length === 0 && unresolvedGroups.length === 0) {
        <div class="empty-state">
          <span aria-hidden="true">H ♡ Q</span>
          <h3>Cuốn lưu ký đang chờ những trang đầu tiên.</h3>
          <p>Thêm media vào <code>public/images/memories/YYYY/MM/DD</code> để bắt đầu viết tiếp câu chuyện.</p>
        </div>
      } @else {
        @if (groups.length) {
          <nav class="chapter-index" aria-label="Mục lục theo tháng">
            @for (group of groups; track group.monthKey) {
              <a [href]="'#' + group.monthKey">{{ group.monthLabel }}</a>
            }
          </nav>

          <div class="chapter-list">
            @for (group of groups; track group.monthKey; let groupIndex = $index) {
              <section class="chapter" [attr.id]="group.monthKey" [attr.aria-labelledby]="group.monthKey + '-title'">
                <header class="chapter-heading">
                  <p>Chương {{ chapterNumber(groupIndex) }}</p>
                  <h3 [id]="group.monthKey + '-title'">{{ group.monthLabel }}</h3>
                  <span>{{ group.memoryCount }} ngày · {{ group.mediaCount }} khoảnh khắc</span>
                </header>
                <div class="memory-grid">
                  @for (memory of group.memories; track memory.id; let memoryIndex = $index) {
                    <app-memory-card
                      [memory]="memory"
                      [featured]="memoryIndex === 0"
                      [priority]="groupIndex === 0 && memoryIndex === 0"
                    />
                  }
                </div>
              </section>
            }
          </div>
        }

        @if (unresolvedGroups.length) {
          <section class="archive" aria-labelledby="archive-title">
            <div class="archive-copy">
              <p class="eyebrow">Kho lưu trữ</p>
              <h3 id="archive-title">Những media chưa thể gọi tên bằng một ngày.</h3>
              <p>Chúng mình giữ chúng ở đây, thay vì gán cho một ngày không chắc chắn.</p>
            </div>
            <button class="archive-toggle" type="button" [attr.aria-expanded]="archiveOpen()" aria-controls="unresolved-media" (click)="archiveOpen.set(!archiveOpen())">
              {{ archiveOpen() ? 'Thu gọn kho lưu trữ' : 'Mở kho lưu trữ' }} <span aria-hidden="true">{{ archiveOpen() ? '−' : '+' }}</span>
            </button>

            @if (archiveOpen()) {
              <div id="unresolved-media" class="archive-groups">
                @for (group of unresolvedGroups; track group.sourceMonth) {
                  <section>
                    <h4>{{ group.label }}</h4>
                    <div class="archive-grid">
                      @for (media of group.media; track media.id; let index = $index) {
                        <button type="button" class="archive-media" (click)="openUnresolvedViewer(group.media, index)" [attr.aria-label]="'Mở ' + mediaLabel(media, index)">
                          <app-media-frame [media]="media" [alt]="mediaLabel(media, index)" sizes="(max-width: 700px) 46vw, 18vw" />
                          <span>{{ media.kind === 'video' ? 'Video' : 'Ảnh' }}</span>
                        </button>
                      }
                    </div>
                  </section>
                }
              </div>
            }
          </section>
        }
      }
    </section>

    @if (viewerOpen()) {
      <app-photo-viewer [images]="viewerMedia" [initialIndex]="viewerIndex()" (closed)="closeViewer()" />
    }
  `,
  styles: [`
    .timeline-wrap { width: min(1240px, calc(100% - 3rem)); margin: 0 auto; padding: 3rem 0 2rem; }
    .section-heading { display: grid; grid-template-columns: minmax(0, 1fr) minmax(180px, 280px); align-items: end; gap: 2rem; max-width: 1080px; margin-bottom: 3.5rem; }
    .eyebrow { margin: 0 0 .8rem; color: var(--wine); font-size: .67rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
    h2, h3, h4 { margin: 0; font-family: var(--font-display); font-weight: 400; }
    h2 { font-size: clamp(2.8rem, 6.4vw, 6.3rem); letter-spacing: -.065em; line-height: .87; }
    .section-note { margin: 0 0 .4rem; color: var(--text-secondary); font-size: .87rem; line-height: 1.72; }
    .chapter-index { display: flex; gap: .25rem 1rem; overflow-x: auto; margin: 0 0 4.5rem; padding-bottom: .75rem; border-bottom: 1px solid var(--border); scrollbar-width: thin; }
    .chapter-index a { flex: 0 0 auto; min-height: 44px; padding: .65rem 0; color: var(--text-muted); font-size: .72rem; font-weight: 600; letter-spacing: .05em; text-decoration: none; }
    .chapter-index a:hover { color: var(--wine); }
    .chapter-list { display: grid; gap: clamp(4rem, 9vw, 8rem); }
    .chapter { scroll-margin-top: 94px; }
    .chapter-heading { display: grid; grid-template-columns: 1fr auto; gap: .45rem 1rem; align-items: end; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
    .chapter-heading p { grid-column: 1 / -1; margin: 0; color: var(--wine); font-size: .65rem; font-weight: 600; letter-spacing: .15em; text-transform: uppercase; }
    .chapter-heading h3 { font-size: clamp(2.25rem, 4vw, 4rem); letter-spacing: -.05em; line-height: .9; }
    .chapter-heading span { color: var(--text-muted); font-size: .74rem; text-align: right; }
    .memory-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: clamp(1.25rem, 2.6vw, 2.5rem); }
    .memory-grid app-memory-card { grid-column: span 4; }
    .memory-grid app-memory-card:first-child { grid-column: span 7; }
    .memory-grid app-memory-card:nth-child(2) { grid-column: span 5; align-self: end; }
    .empty-state { display: grid; justify-items: center; min-height: 330px; padding: 2rem; border: 1px dashed var(--border-strong); background: var(--surface); text-align: center; }
    .empty-state span { color: var(--wine); font-size: .72rem; font-weight: 600; letter-spacing: .16em; }
    .empty-state h3 { max-width: 560px; margin: .8rem 0; font-size: clamp(2rem, 4vw, 3.4rem); }
    .empty-state p { max-width: 600px; margin: 0; color: var(--text-secondary); line-height: 1.7; }
    code { padding: .1rem .3rem; background: var(--surface-soft); font-size: .88em; }
    .archive { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1.5rem 3rem; margin-top: clamp(5rem, 10vw, 9rem); padding-top: 2.5rem; border-top: 1px solid var(--border-strong); }
    .archive-copy { max-width: 710px; }
    .archive-copy h3 { font-size: clamp(2rem, 4vw, 3.6rem); letter-spacing: -.05em; line-height: .95; }
    .archive-copy p:last-child { margin: 1rem 0 0; color: var(--text-secondary); line-height: 1.7; }
    .archive-toggle { align-self: end; min-height: 48px; padding: .7rem 1rem; border: 1px solid var(--wine); background: transparent; color: var(--wine); cursor: pointer; font-size: .7rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; transition: background 180ms var(--ease-out), color 180ms var(--ease-out); }
    .archive-toggle:hover { background: var(--wine); color: #fffdf9; }
    .archive-toggle span { margin-left: .55rem; font-size: 1.2rem; }
    .archive-groups { grid-column: 1 / -1; display: grid; gap: 2rem; padding-top: 1rem; }
    .archive-groups h4 { margin-bottom: .9rem; color: var(--wine); font-size: 1.15rem; }
    .archive-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: .8rem; }
    .archive-media { display: grid; gap: .45rem; min-width: 0; padding: 0; border: 0; background: transparent; color: var(--text-secondary); cursor: zoom-in; text-align: left; }
    .archive-media app-media-frame { aspect-ratio: 4 / 5; }
    .archive-media span { font-size: .67rem; }
    @media (max-width: 860px) { .memory-grid app-memory-card { grid-column: span 6; } .memory-grid app-memory-card:first-child { grid-column: span 12; } .memory-grid app-memory-card:nth-child(2) { grid-column: span 6; } .archive-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    @media (max-width: 620px) {
      .timeline-wrap { width: min(100% - 2rem, 560px); padding-top: 2.5rem; }
      .section-heading { display: block; margin-bottom: 2.5rem; }
      .section-note { max-width: 360px; margin-top: 1.1rem; }
      .chapter-index { margin-bottom: 3.2rem; }
      .chapter-heading { grid-template-columns: 1fr; }
      .chapter-heading span { text-align: left; }
      .memory-grid { grid-template-columns: 1fr; gap: 2.2rem; }
      .memory-grid app-memory-card, .memory-grid app-memory-card:first-child, .memory-grid app-memory-card:nth-child(2) { grid-column: 1; }
      .archive { display: grid; grid-template-columns: 1fr; }
      .archive-toggle { justify-self: start; }
      .archive-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `]
})
export class TimelineComponent {
  private readonly memoryService = inject(MemoryService);

  protected readonly groups = this.memoryService.getMonthMemoryGroups();
  protected readonly unresolvedGroups = this.memoryService.getUnresolvedMediaGroups();
  protected readonly archiveOpen = signal(false);
  protected readonly viewerOpen = signal(false);
  protected readonly viewerIndex = signal(0);
  protected viewerMedia: readonly MemoryMedia[] = [];

  protected chapterNumber(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  protected mediaLabel(media: MemoryMedia, index: number): string {
    return media.alt || `${media.kind === 'video' ? 'Video' : 'Ảnh'} chưa xác định ngày ${index + 1}`;
  }

  protected openUnresolvedViewer(media: readonly MemoryMedia[], index: number): void {
    this.viewerMedia = media;
    this.viewerIndex.set(index);
    this.viewerOpen.set(true);
  }

  protected closeViewer(): void {
    this.viewerOpen.set(false);
  }
}
