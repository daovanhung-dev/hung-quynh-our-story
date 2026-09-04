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
import type { MemoryImage } from '../../../core/models/memory.model';

@Component({
  selector: 'app-photo-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="viewer" role="dialog" aria-modal="true" aria-label="Xem ảnh toàn màn hình" (click)="close()">
      <button class="close" type="button" aria-label="Đóng" (click)="$event.stopPropagation(); close()">×</button>

      @if (images.length > 1) {
        <button class="nav prev" type="button" aria-label="Ảnh trước" (click)="$event.stopPropagation(); previous()">←</button>
      }

      <figure (click)="$event.stopPropagation()">
        <img
          [src]="currentImage.src"
          [alt]="currentImage.alt || 'Ảnh kỷ niệm'"
          (touchstart)="onTouchStart($event)"
          (touchend)="onTouchEnd($event)"
        >
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
      padding: 4rem 5rem;
      background: rgba(16, 13, 14, .94);
      backdrop-filter: blur(12px);
      animation: viewer-in 260ms ease both;
    }

    figure { display: grid; gap: 1rem; max-width: min(92vw, 1500px); max-height: 86dvh; margin: 0; }
    img { max-width: 100%; max-height: 78dvh; margin: auto; object-fit: contain; border-radius: 12px; animation: image-in 300ms var(--ease-soft) both; }
    figcaption { max-width: 780px; margin: auto; color: rgba(255,255,255,.82); text-align: center; line-height: 1.6; }

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
    }

    .close { top: 1rem; right: 1rem; font-size: 1.6rem; }
    .nav { top: 50%; transform: translateY(-50%); font-size: 1.2rem; }
    .prev { left: 1rem; }
    .next { right: 1rem; }
    .counter { position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,.72); font-size: .85rem; }

    @keyframes viewer-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes image-in { from { opacity: 0; transform: scale(.975); } to { opacity: 1; transform: scale(1); } }

    @media (max-width: 720px) {
      .viewer { padding: 4.5rem 1rem 4rem; }
      .nav { display: none; }
      img { max-height: 72dvh; }
    }

    @media (prefers-reduced-motion: reduce) {
      .viewer, img { animation: none; }
    }
  `]
})
export class PhotoViewerComponent implements OnInit, OnChanges, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private touchStartX = 0;

  @Input({ required: true }) images: readonly MemoryImage[] = [];
  @Input() initialIndex = 0;
  @Output() readonly closed = new EventEmitter<void>();

  protected activeIndex = 0;

  protected get currentImage(): MemoryImage {
    return this.images[this.activeIndex] ?? { id: 'missing', src: '' };
  }

  ngOnInit(): void {
    this.lockScroll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialIndex'] || changes['images']) {
      this.activeIndex = Math.min(Math.max(this.initialIndex, 0), Math.max(this.images.length - 1, 0));
    }
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.arrowright')
  next(): void {
    if (!this.images.length) return;
    this.activeIndex = (this.activeIndex + 1) % this.images.length;
  }

  @HostListener('document:keydown.arrowleft')
  previous(): void {
    if (!this.images.length) return;
    this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
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
    this.document.body.style.overflow = 'hidden';
  }
}
