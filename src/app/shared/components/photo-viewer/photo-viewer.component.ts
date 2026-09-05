import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import type { MemoryMedia } from '../../../core/models/memory.model';

@Component({
  selector: 'app-photo-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="viewer" aria-label="Xem kỷ niệm toàn màn hình" (click)="onBackdrop($event)" (cancel)="onCancel($event)" (close)="notifyClosed()">
      <button class="close" type="button" aria-label="Đóng trình xem ảnh" (click)="close()">×</button>
      @if (images.length > 1) {
        <button class="nav prev" type="button" aria-label="Ảnh trước" (click)="previous()">←</button>
      }
      <figure class="viewer-figure">
        @if (currentMedia.kind === 'video') {
          <video [src]="currentMedia.src" [poster]="currentMedia.posterSrc" controls playsinline preload="metadata" [attr.aria-label]="currentMedia.alt || 'Video kỷ niệm'" (touchstart)="onTouchStart($event)" (touchend)="onTouchEnd($event)"></video>
        } @else {
          <picture>
            @if (mobileSrcSet) {
              <source media="(max-width: 700px)" type="image/webp" [attr.srcset]="mobileSrcSet" sizes="100vw">
            }
            <img [src]="imageSource" [attr.srcset]="srcSet" [attr.width]="currentMedia.width || null" [attr.height]="currentMedia.height || null" [alt]="currentMedia.alt || 'Ảnh kỷ niệm'" (touchstart)="onTouchStart($event)" (touchend)="onTouchEnd($event)">
          </picture>
        }
        @if (currentMedia.caption) { <figcaption>{{ currentMedia.caption }}</figcaption> }
      </figure>
      @if (images.length > 1) {
        <button class="nav next" type="button" aria-label="Ảnh tiếp theo" (click)="next()">→</button>
        <p class="counter" aria-live="polite">{{ activeIndex + 1 }} / {{ images.length }}</p>
      }
    </dialog>
  `,
  styles: [`
    .viewer { width: 100%; max-width: none; height: 100svh; height: 100dvh; max-height: none; margin: 0; padding: max(1rem,calc(env(safe-area-inset-top) + 1rem)) max(1rem,env(safe-area-inset-right)) max(1rem,env(safe-area-inset-bottom)) max(1rem,env(safe-area-inset-left)); border: 0; background: #171013; color: #fffdf9; overscroll-behavior:contain; }
    .viewer::backdrop { background: rgba(23,16,19,.96); }
    .viewer-figure { display: grid; place-items: center; gap: .9rem; width: 100%; height: 100%; margin: 0; }
    picture { display: contents; }
    img, video { max-width: min(100%, 1500px); max-height: min(78dvh, 100%); border: 1px solid rgba(255,253,249,.13); object-fit: contain; box-shadow: 0 18px 70px rgba(0,0,0,.3); touch-action:pan-y; }
    figcaption { max-width: min(90vw, 720px); color: rgba(255,253,249,.82); font-family: var(--font-display); font-size: 1rem; line-height: 1.6; text-align: center; }
    button { position: fixed; display: grid; width: 46px; height: 46px; place-items: center; border: 1px solid rgba(255,253,249,.23); background: rgba(255,253,249,.08); color: #fffdf9; cursor: pointer; transition: transform 180ms var(--ease-out), background 180ms var(--ease-out); }
    button:hover { background: rgba(255,253,249,.16); transform: translateY(-2px); }
    .close { top: max(1rem,env(safe-area-inset-top)); right: max(1rem,env(safe-area-inset-right)); font-size: 1.65rem; }
    .nav { top: 50%; font-size: 1.2rem; transform: translateY(-50%); }
    .nav:hover { transform: translateY(calc(-50% - 2px)); }
    .prev { left: 1rem; }
    .next { right: 1rem; }
    .counter { position: fixed; bottom: max(1rem,env(safe-area-inset-bottom)); left: 50%; margin: 0; color: rgba(255,253,249,.68); font-size: .68rem; letter-spacing: .16em; transform: translateX(-50%); }
    @media (max-width: 680px) { .viewer { padding: max(3.5rem,calc(env(safe-area-inset-top) + 2.5rem)) max(1rem,env(safe-area-inset-right)) max(3.5rem,calc(env(safe-area-inset-bottom) + 2rem)) max(1rem,env(safe-area-inset-left)); } .viewer-figure { gap:.6rem; min-height:0; } .nav { display: none; } img, video { max-height:min(68dvh,calc(100dvh - 11rem)); } figcaption { max-width:100%; max-height:18dvh; overflow:auto; padding-inline:.5rem; font-size:.95rem; } }
  `]
})
export class PhotoViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private previousOverflow = '';
  private returnFocus?: HTMLElement;
  private touchStartX = 0;

  @ViewChild('dialog', { static: true }) private readonly dialogRef?: ElementRef<HTMLDialogElement>;
  @Input({ required: true }) images: readonly MemoryMedia[] = [];
  @Input() initialIndex = 0;
  @Output() readonly closed = new EventEmitter<void>();

  protected activeIndex = 0;

  protected get currentMedia(): MemoryMedia {
    return this.images[this.activeIndex] ?? { id: 'missing', kind: 'image', src: '' };
  }

  protected get imageSource(): string {
    return this.currentMedia.mediumSrc || this.currentMedia.displaySrc || this.currentMedia.src;
  }

  protected get srcSet(): string | undefined {
    const media = this.currentMedia;
    return media.thumbnailSrc && media.displaySrc && media.mediumSrc
      ? `${media.thumbnailSrc} 480w, ${media.displaySrc} 960w, ${media.mediumSrc} 1440w`
      : undefined;
  }

  protected get mobileSrcSet(): string | undefined {
    const media = this.currentMedia;
    return media.thumbnailSrc && media.displaySrc
      ? `${media.thumbnailSrc} 480w, ${media.displaySrc} 960w`
      : undefined;
  }

  ngAfterViewInit(): void {
    this.returnFocus = this.document.activeElement instanceof HTMLElement ? this.document.activeElement : undefined;
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.dialogRef?.nativeElement.showModal();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images'] || changes['initialIndex']) {
      this.activeIndex = Math.min(Math.max(this.initialIndex, 0), Math.max(this.images.length - 1, 0));
      this.prefetchAdjacent();
    }
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = this.previousOverflow;
    const dialog = this.dialogRef?.nativeElement;
    if (dialog?.open) dialog.close();
  }

  @HostListener('document:keydown.arrowright')
  protected next(): void {
    if (!this.images.length) return;
    this.activeIndex = (this.activeIndex + 1) % this.images.length;
    this.prefetchAdjacent();
  }

  @HostListener('document:keydown.arrowleft')
  protected previous(): void {
    if (!this.images.length) return;
    this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
    this.prefetchAdjacent();
  }

  protected close(): void {
    this.dialogRef?.nativeElement.close();
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialogRef?.nativeElement) this.close();
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

  protected notifyClosed(): void {
    this.document.body.style.overflow = this.previousOverflow;
    this.returnFocus?.focus();
    this.closed.emit();
  }

  private prefetchAdjacent(): void {
    if (typeof Image === 'undefined' || this.images.length < 2) return;
    for (const offset of [-1, 1]) {
      const index = (this.activeIndex + offset + this.images.length) % this.images.length;
      const media = this.images[index];
      if (media?.kind === 'image') {
        const preloaded = new Image();
        preloaded.src = media.displaySrc || media.mediumSrc || media.src;
      }
    }
  }
}
