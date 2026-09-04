import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Memory } from '../../core/models/memory.model';
import { MemoryService } from '../../core/services/memory.service';
import { PhotoViewerComponent } from '../../shared/components/photo-viewer/photo-viewer.component';

@Component({
  standalone: true,
  imports: [RouterLink, PhotoViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (memory; as item) {
      <article class="memory-page">
        <a class="back" routerLink="/timeline">← Quay lại dòng thời gian</a>

        <header>
          <p class="eyebrow">Một ngày của chúng mình</p>
          <time [attr.datetime]="item.date">{{ formatDate(item.date) }}</time>
          <h1>{{ item.title || 'Một ngày rất đáng nhớ' }}</h1>
          @if (item.caption) { <p class="caption">{{ item.caption }}</p> }
          @if (item.location) { <p class="location">⌖ {{ item.location }}</p> }
          <p class="media-count">{{ item.images.length }} ảnh / video trong ngày này</p>
        </header>

        <section class="gallery" aria-label="Ảnh kỷ niệm">
          @for (image of item.images; track image.id; let index = $index) {
            <button type="button" class="photo" (click)="openViewer(index)" [attr.aria-label]="'Mở media ' + (index + 1)">
              @if (image.kind === 'video') {
                <video
                  [src]="image.src"
                  [poster]="image.posterSrc"
                  muted
                  playsinline
                  preload="none"
                  aria-label="Video kỷ niệm"
                ></video>
              } @else {
                <img [src]="image.mediumSrc || image.src" [alt]="image.alt || item.title || 'Ảnh kỷ niệm'" loading="lazy" decoding="async">
              }
            </button>
          }
        </section>
      </article>

      @if (viewerOpen) {
        <app-photo-viewer [images]="item.images" [initialIndex]="viewerIndex" (closed)="closeViewer()" />
      }
    } @else {
      <section class="missing">
        <span>♡</span>
        <h1>Có vẻ kỷ niệm này đang trốn đâu đó.</h1>
        <a routerLink="/timeline">Trở lại những ngày của chúng mình</a>
      </section>
    }
  `,
  styles: [`
    .memory-page { width: min(1180px, 90vw); margin: 0 auto; padding: 3rem 0 5rem; }
    .back { display: inline-flex; margin-bottom: 4rem; color: var(--text-secondary); text-decoration: none; transition: color 180ms ease, transform 180ms ease; }
    .back:hover { color: var(--accent-deep); transform: translateX(-3px); }
    header { max-width: 880px; margin-bottom: 3.5rem; }
    .eyebrow { margin: 0 0 .7rem; color: var(--accent-deep); font-size: .7rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
    time, .location { color: var(--text-muted); font-size: .86rem; }
    h1 { margin: .6rem 0 1.2rem; font-family: var(--font-display); font-size: clamp(3.4rem, 8vw, 7.3rem); font-weight: 400; line-height: .88; letter-spacing: -.065em; }
    .caption { max-width: 720px; margin: 0; color: var(--text-secondary); font-family: var(--font-display); font-size: clamp(1.3rem, 3vw, 2rem); line-height: 1.45; }
    .location { margin-top: 1rem; }
    .media-count { margin: 1.4rem 0 0; color: var(--text-muted); font-size: .78rem; letter-spacing: .04em; }

    .gallery { columns: 2 420px; column-gap: 1.2rem; }
    .photo { display: block; width: 100%; margin: 0 0 1.2rem; padding: 0; overflow: hidden; break-inside: avoid; border: 1px solid rgba(143,81,93,.1); border-radius: var(--radius-xl); background: var(--surface-muted); cursor: zoom-in; box-shadow: var(--shadow-soft); }
    .photo img, .photo video { display: block; width: 100%; height: auto; transition: transform 380ms var(--ease-soft), filter 380ms var(--ease-soft); }
    .photo:hover img, .photo:hover video { transform: scale(1.012); }

    .missing { display: grid; place-items: center; min-height: 70dvh; padding: 2rem; text-align: center; }
    .missing span { color: var(--accent); font-size: 2.5rem; }
    .missing h1 { max-width: 760px; margin: 1rem 0; }
    .missing a { color: var(--accent-deep); }

    @media (max-width: 640px) {
      .memory-page { width: calc(100% - 2rem); padding-top: 2rem; }
      .back { margin-bottom: 2.5rem; }
      header { margin-bottom: 2.4rem; }
      .gallery { columns: 1; }
    }
  `]
})
export class MemoryDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly memoryService = inject(MemoryService);

  protected readonly memory: Memory | undefined = this.memoryService.getMemoryById(
    this.route.snapshot.paramMap.get('id') ?? ''
  );

  protected viewerOpen = false;
  protected viewerIndex = 0;

  protected formatDate(date: string): string {
    return this.memoryService.formatDate(date);
  }

  protected openViewer(index: number): void {
    this.viewerIndex = index;
    this.viewerOpen = true;
  }

  protected closeViewer(): void {
    this.viewerOpen = false;
  }
}
