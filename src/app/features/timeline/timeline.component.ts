import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MemoryMedia } from '../../core/models/memory.model';
import { MemoryService } from '../../core/services/memory.service';
import { AmbientPhotoGalleryComponent } from '../../shared/components/ambient-photo-gallery/ambient-photo-gallery.component';
import { MemoryCardComponent } from '../../shared/components/memory-card/memory-card.component';
import { MediaFrameComponent } from '../../shared/components/media-frame/media-frame.component';
import { PhotoViewerComponent } from '../../shared/components/photo-viewer/photo-viewer.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [RouterLink, AmbientPhotoGalleryComponent, MemoryCardComponent, MediaFrameComponent, PhotoViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="timeline-wrap" aria-labelledby="timeline-title">
      <header class="section-heading">
        <div>
          <p class="eyebrow">04.01.2026 · Ngày chúng mình bắt đầu yêu nhau</p>
          <h2 id="timeline-title">Những ngày<br>đã đưa anh đến gần em hơn.</h2>
        </div>
        <p class="section-note">Một tấm ảnh cũng đủ đưa mình trở về.</p>
      </header>

      <div class="timeline-ambient">
        <app-ambient-photo-gallery [photos]="ambientPhotos" layout="rail" sizes="(max-width: 640px) 24vw, 18vw" />
      </div>

      @if (groups.length === 0 && unresolvedGroups.length === 0) {
        <div class="empty-state">
          <span aria-hidden="true">H ♡ Q</span>
          <h3>Những trang đầu tiên đang chờ được viết.</h3>
          <p>Khi có thêm ảnh, câu chuyện của chúng mình sẽ tiếp tục dài ra ở đây.</p>
        </div>
      } @else {
        @if (groups.length) {
          <nav class="chapter-index" aria-label="Mục lục kỷ niệm theo tháng">
            @for (group of groups; track group.monthKey) {
              <a [href]="'#' + group.monthKey">{{ group.monthLabel }}</a>
            }
          </nav>

          <div class="chapter-list">
            @for (group of groups; track group.monthKey; let groupIndex = $index) {
              <section class="chapter" [attr.id]="group.monthKey" [attr.aria-labelledby]="group.monthKey + '-title'">
                <header class="chapter-heading">
                  <p>Chapter {{ chapterNumber(groupIndex) }}</p>
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
          <section class="bonus" aria-labelledby="bonus-title">
            <div class="bonus-copy">
              <p class="eyebrow">Bonus memories ♡</p>
              <h3 id="bonus-title">Một vài khoảnh khắc nhỏ khác.</h3>
              <p>Những tấm ảnh chưa gọi tên được bằng một ngày.</p>
            </div>
            <button class="bonus-toggle" type="button" [attr.aria-expanded]="archiveOpen()" aria-controls="bonus-memories" (click)="archiveOpen.set(!archiveOpen())">
              {{ archiveOpen() ? 'Thu lại' : 'Mở những khoảnh khắc khác' }} <span aria-hidden="true">{{ archiveOpen() ? '−' : '+' }}</span>
            </button>

            @if (archiveOpen()) {
              <div id="bonus-memories" class="bonus-groups">
                @for (group of unresolvedGroups; track group.sourceMonth) {
                  <section>
                    <h4>{{ group.label }}</h4>
                    <div class="bonus-grid">
                      @for (media of group.media; track media.id; let index = $index) {
                        <button type="button" class="bonus-media" (click)="openUnresolvedViewer(group.media, index)" [attr.aria-label]="'Mở ' + mediaLabel(media, index)">
                          <app-media-frame [media]="media" [alt]="mediaLabel(media, index)" sizes="(max-width:700px) 46vw,18vw" />
                          <span>{{ media.kind === 'video' ? 'Một đoạn video' : 'Một tấm ảnh' }}</span>
                        </button>
                      }
                    </div>
                  </section>
                }
              </div>
            }
          </section>
        }

        <section class="continue-gift" aria-labelledby="continue-gift-title">
          <span aria-hidden="true">♡</span>
          <p>Vậy là mình vừa đi lại một đoạn câu chuyện.</p>
          <h3 id="continue-gift-title">Nhưng món quà vẫn còn một vài điều<br>anh muốn nói với em.</h3>
          <a routerLink="/birthday/home" fragment="reasons">Tiếp tục món quà <i aria-hidden="true">↘</i></a>
        </section>
      }
    </section>

    @if (viewerOpen()) {
      <app-photo-viewer [images]="viewerMedia" [initialIndex]="viewerIndex()" (closed)="closeViewer()" />
    }
  `,
  styles: [`
    .timeline-wrap { width:min(1240px,calc(100% - 3rem)); margin:0 auto; padding:clamp(4rem,8vw,7rem) 0 3rem; }
    .section-heading { display:grid; grid-template-columns:minmax(0,1fr) minmax(220px,320px); align-items:end; gap:2rem; max-width:1120px; margin-bottom:4.2rem; }
    .eyebrow { margin:0 0 .8rem; color:var(--wine); font-size:.67rem; font-weight:600; letter-spacing:.16em; text-transform:uppercase; }
    h2,h3,h4 { margin:0; font-family:var(--font-display); font-weight:400; }
    h2 { font-size:clamp(3rem,6.6vw,6.7rem); letter-spacing:-.067em; line-height:.86; }
    .section-note { margin:0 0 .45rem; color:var(--text-secondary); font-family:var(--font-display); font-size:.98rem; line-height:1.72; }
    .timeline-ambient { width:min(100%,980px); height:clamp(8rem,18vw,15rem); margin:-1.5rem 0 4.5rem auto; opacity:.78; }
    .chapter-index { display:flex; gap:.25rem 1.2rem; overflow-x:auto; margin:0 0 5.5rem; padding-bottom:.75rem; border-bottom:1px solid var(--border); scrollbar-width:thin; }
    .chapter-index a { flex:0 0 auto; min-height:44px; padding:.65rem 0; color:var(--text-muted); font-size:.71rem; font-weight:600; letter-spacing:.05em; text-decoration:none; }
    .chapter-index a:hover { color:var(--wine); }
    .chapter-list { display:grid; gap:clamp(5rem,10vw,9rem); }
    .chapter { scroll-margin-top:120px; }
    .chapter-heading { display:grid; grid-template-columns:1fr auto; gap:.45rem 1rem; align-items:end; margin-bottom:1.8rem; padding-bottom:1rem; border-bottom:1px solid var(--border); }
    .chapter-heading p { grid-column:1/-1; margin:0; color:var(--wine); font-size:.64rem; font-weight:600; letter-spacing:.16em; text-transform:uppercase; }
    .chapter-heading h3 { font-size:clamp(2.5rem,4.6vw,4.5rem); letter-spacing:-.055em; line-height:.88; }
    .chapter-heading span { color:var(--text-muted); font-size:.73rem; text-align:right; }
    .memory-grid { display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:clamp(1.5rem,3vw,3.2rem); align-items:start; }
    .memory-grid app-memory-card { grid-column:span 4; }
    .memory-grid app-memory-card:first-child { grid-column:span 7; }
    .memory-grid app-memory-card:nth-child(2) { grid-column:span 5; margin-top:clamp(3rem,7vw,7rem); }
    .memory-grid app-memory-card:nth-child(5n) { grid-column:2/span 5; }
    .memory-grid app-memory-card:nth-child(6n) { grid-column:8/span 5; margin-top:3rem; }
    .empty-state { display:grid; justify-items:center; min-height:330px; padding:2rem; border:1px dashed var(--border-strong); background:var(--surface); text-align:center; }
    .empty-state span { color:var(--wine); font-size:.72rem; font-weight:600; letter-spacing:.16em; }
    .empty-state h3 { max-width:560px; margin:.8rem 0; font-size:clamp(2rem,4vw,3.4rem); }
    .empty-state p { max-width:600px; margin:0; color:var(--text-secondary); line-height:1.7; }
    .bonus { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:1.5rem 3rem; margin-top:clamp(6rem,11vw,10rem); padding-top:3rem; border-top:1px solid var(--border-strong); }
    .bonus-copy { max-width:700px; }
    .bonus-copy h3 { font-size:clamp(2.2rem,4.2vw,3.8rem); letter-spacing:-.05em; line-height:.95; }
    .bonus-copy p:last-child { margin:1rem 0 0; color:var(--text-secondary); font-family:var(--font-display); line-height:1.7; }
    .bonus-toggle { align-self:end; min-height:48px; padding:.7rem 1rem; border:1px solid var(--wine); background:transparent; color:var(--wine); cursor:pointer; font-size:.68rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase; }
    .bonus-toggle span { margin-left:.55rem; font-size:1.2rem; }
    .bonus-groups { grid-column:1/-1; display:grid; gap:2rem; padding-top:1rem; }
    .bonus-groups h4 { margin-bottom:.9rem; color:var(--wine); font-size:1.15rem; }
    .bonus-grid { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:.8rem; }
    .bonus-media { display:grid; gap:.45rem; min-width:0; padding:0; border:0; background:transparent; color:var(--text-secondary); cursor:zoom-in; text-align:left; }
    .bonus-media app-media-frame { aspect-ratio:4/5; }
    .bonus-media span { font-size:.66rem; }
    .continue-gift { display:grid; justify-items:center; margin-top:clamp(7rem,13vw,12rem); padding:clamp(5rem,9vw,8rem) 1rem; border-top:1px solid var(--border); text-align:center; }
    .continue-gift > span { color:var(--wine); font-family:Georgia,serif; font-size:2.2rem; }
    .continue-gift > p { margin:.8rem 0 .6rem; color:var(--text-muted); font-size:.75rem; }
    .continue-gift h3 { max-width:780px; font-size:clamp(2.6rem,5.5vw,5.5rem); letter-spacing:-.06em; line-height:.9; }
    .continue-gift a { display:inline-flex; align-items:center; gap:.7rem; min-height:50px; margin-top:2rem; padding:.8rem 1rem; border:1px solid var(--wine); background:var(--wine); color:#fffdf9; font-size:.69rem; font-weight:600; letter-spacing:.08em; text-decoration:none; text-transform:uppercase; }
    .continue-gift i { font-size:1rem; font-style:normal; }
    @media (max-width:900px) { .memory-grid app-memory-card { grid-column:span 6; } .memory-grid app-memory-card:first-child { grid-column:span 12; } .memory-grid app-memory-card:nth-child(2),.memory-grid app-memory-card:nth-child(5n),.memory-grid app-memory-card:nth-child(6n) { grid-column:span 6; margin-top:0; } .bonus-grid { grid-template-columns:repeat(4,minmax(0,1fr)); } }
    @media (max-width:620px) {
      .timeline-wrap { width:min(calc(100% - 2rem),560px); padding-top:3rem; }
      .section-heading { display:block; margin-bottom:3rem; }
      h2 { font-size:clamp(2.45rem,12vw,4.6rem); line-height:.9; }
      .section-note { max-width:380px; margin-top:1.2rem; }
      .timeline-ambient { width:100%; height:7rem; margin:-1rem 0 3.5rem; }
      .chapter-index { margin-bottom:3.5rem; padding-inline:.2rem; scroll-padding-inline:.2rem; }
      .chapter-heading { grid-template-columns:1fr; }
      .chapter-heading span { text-align:left; }
      .memory-grid { grid-template-columns:1fr; gap:2.5rem; }
      .memory-grid app-memory-card,.memory-grid app-memory-card:first-child,.memory-grid app-memory-card:nth-child(2),.memory-grid app-memory-card:nth-child(5n),.memory-grid app-memory-card:nth-child(6n) { grid-column:1; margin-top:0; }
      .bonus { grid-template-columns:1fr; }
      .bonus-toggle { justify-self:start; width:min(100%,22rem); min-height:52px; }
      .bonus-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .continue-gift { margin-top:5rem; padding-block:4.5rem; }
      .continue-gift h3 { font-size:clamp(2.35rem,11vw,4.6rem); }
      .continue-gift a { width:min(100%,22rem); justify-content:center; min-height:52px; }
    }
  `]
})
export class TimelineComponent {
  private readonly memoryService = inject(MemoryService);
  protected readonly groups = this.memoryService.getMonthMemoryGroups();
  protected readonly unresolvedGroups = this.memoryService.getUnresolvedMediaGroups();
  protected readonly ambientPhotos = this.memoryService.getRandomImageMedia(3);
  protected readonly archiveOpen = signal(false);
  protected readonly viewerOpen = signal(false);
  protected readonly viewerIndex = signal(0);
  protected viewerMedia: readonly MemoryMedia[] = [];

  protected chapterNumber(index: number): string { return String(index + 1).padStart(2, '0'); }
  protected mediaLabel(media: MemoryMedia, index: number): string { return media.alt || `${media.kind === 'video' ? 'Video' : 'Ảnh'} kỷ niệm ${index + 1}`; }
  protected openUnresolvedViewer(media: readonly MemoryMedia[], index: number): void { this.viewerMedia = media; this.viewerIndex.set(index); this.viewerOpen.set(true); }
  protected closeViewer(): void { this.viewerOpen.set(false); }
}
