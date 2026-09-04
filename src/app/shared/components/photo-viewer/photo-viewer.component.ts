import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import type { MemoryMedia } from '../../../core/models/memory.model';

@Component({
  selector: 'app-photo-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="viewer" role="dialog" aria-modal="true" aria-label="Xem kỷ niệm toàn màn hình" (click)="close()">
      <button class="close" type="button" aria-label="Đóng" (click)="$event.stopPropagation(); close()">×</button>

      @if (images.length > 1) {
        <button class="nav prev" type="button" aria-label="Ảnh trước" (click)="$event.stopPropagation(); previous()">←</button>
      }

      <figure class="viewer-figure" (click)="$event.stopPropagation()">
        @if (currentImage.kind === 'video') {
          <video
            [src]="currentImage.src"
            [poster]="currentImage.posterSrc"
            controls
            playsinline
            preload="metadata"
            [attr.aria-label]="currentImage.alt || 'Video kỷ niệm'"
            (touchstart)="onTouchStart($event)"
            (touchend)="onTouchEnd($event)"
          ></video>
        } @else {
          <img
            [src]="imageSource"
            [alt]="currentImage.alt || 'Ảnh kỷ niệm'"
            (touchstart)="onTouchStart($event)"
            (touchend)="onTouchEnd($event)"
          >
        }
        @if (currentImage.caption) {
          <figcaption>{{ currentImage.caption }}</figcaption>
        }
      </figure>

      @if (images.length > 1) {
        <button class="nav next" type="button" aria-label="Ảnh tiếp theo" (click)="$event.stopPropagation(); next()">→</button>
        <span class="counter">{{ activeIndex + 1 }} / {{ images.length }}</span>
      }
    </div>
  `,
  styles: [`
    .viewer {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 4rem 5rem 4.5rem;
      background:
        radial-gradient(circle at 50% 42%, rgba(104, 46, 66, .22), transparent 35%),
        rgba(20, 14, 16, .96);
      backdrop-filter: blur(12px);
      animation: viewer-in 260ms ease both;
    }

    .viewer-figure { display: grid; gap: 1rem; max-width: min(92vw, 1500px); max-height: 86dvh; margin: 0; }
    img, video { max-width: 100%; max-height: 76dvh; margin: auto; object-fit: contain; border: 1px solid rgba(255,255,255,.12); border-radius: 14px; box-shadow: 0 30px 90px rgba(0,0,0,.3); animation: image-in 300ms var(--ease-soft) both; }
    figcaption { max-width: 780px; margin: auto; color: rgba(255,255,255,.82); font-family: var(--font-display); font-size: 1.05rem; text-align: center; line-height: 1.6; }

    button {
      position: fixed;
      display: grid;
      place-items: center;
      width: 46px;
      height: 46px;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 999px;
      background: rgba(255,255,255,.08);
      color: white;
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: background 180ms ease, transform 180ms ease, border-color 180ms ease;
    }

    button:hover { border-color: rgba(255,255,255,.38); background: rgba(255,255,255,.14); }

    .close { top: 1rem; right: 1rem; font-size: 1.6rem; }
    .nav { top: 50%; transform: translateY(-50%); font-size: 1.2rem; }
    .prev { left: 1rem; }
    .next { right: 1rem; }
    .counter { position: fixed; bottom: 1.3rem; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,.72); font-size: .75rem; letter-spacing: .16em; }

    @keyframes viewer-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes image-in { from { opacity: 0; transform: scale(.975); } to { opacity: 1; transform: scale(1); } }

    @media (max-width: 720px) {
      .viewer { padding: 4.5rem 1rem 4rem; }
      .nav { display: none; }
      img, video { max-height: 70dvh; }
    }

    @media (prefers-reduced-motion: reduce) {
      .viewer, img { animation: none; }
    }
  `]
})
export class PhotoViewerComponent implements OnInit, OnChanges, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private touchStartX = 0;

  @Input({ required: true }) images: readonly MemoryMedia[] = [];
  @Input() initialIndex = 0;
  @Output() readonly closed = new EventEmitter<void>();

  protected activeIndex = 0;
  private previousOverflow = '';

  protected get currentImage(): MemoryMedia {
    return this.images[this.activeIndex] ?? { id: 'missing', kind: 'image', src: '' };
  }

  protected get imageSource(): string {
    return this.currentImage.mediumSrc || this.currentImage.src;
  }

  ngOnInit(): void {
    this.lockScroll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialIndex'] || changes['images']) {
      this.activeIndex = Math.min(Math.max(this.initialIndex, 0), Math.max(this.images.length - 1, 0));
      this.prefetchAdjacent();
    }
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = this.previousOverflow;
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.arrowright')
  next(): void {
    if (!this.images.length) return;
    this.activeIndex = (this.activeIndex + 1) % this.images.length;
    this.prefetchAdjacent();
  }

  @HostListener('document:keydown.arrowleft')
  previous(): void {
    if (!this.images.length) return;
    this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
    this.prefetchAdjacent();
  }

  protected onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? 0;
  }

  protected onTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0]?.clientX ?? this.touchStartX;
    const delta = endX - this.touchStartX;
    if (Math.abs(delta) < 50) return;
    delta < 0 ? this.next() : this.previous();
  }

  private lockScroll(): void {
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
  }

  private prefetchAdjacent(): void {
    if (typeof Image === 'undefined' || this.images.length < 2) return;

    for (const offset of [-1, 1]) {
      const index = (this.activeIndex + offset + this.images.length) % this.images.length;
      const image = this.images[index];
      if (image?.kind === 'image') {
        const preloaded = new Image();
        preloaded.src = image.mediumSrc || image.src;
      }
    }
  }
}
