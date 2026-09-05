import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { MemoryMedia } from '../../../core/models/memory.model';

@Component({
  selector: 'app-media-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="media-frame" [class.is-video]="media.kind === 'video'" [class.failed]="failed" [style.aspect-ratio]="aspectRatio">
      @if (media.kind === 'video') {
        @if (media.posterSrc) {
          <img [src]="media.posterSrc" [alt]="alt" loading="lazy" decoding="async">
        } @else {
          <div class="video-placeholder" aria-hidden="true"><span>▶</span><small>Video</small></div>
        }
      } @else if (!failed) {
        <picture>
          @if (mobileSrcSet) {
            <source media="(max-width: 700px)" type="image/webp" [attr.srcset]="mobileSrcSet" [attr.sizes]="sizes">
          }
          <img
            [src]="media.thumbnailSrc || media.displaySrc || media.src"
            [attr.srcset]="srcSet"
            [attr.sizes]="sizes"
            [attr.width]="media.width || null"
            [attr.height]="media.height || null"
            [attr.fetchpriority]="priority ? 'high' : null"
            [attr.loading]="priority ? 'eager' : 'lazy'"
            [alt]="alt"
            decoding="async"
            (error)="failed = true"
          >
        </picture>
      } @else {
        <div class="image-placeholder" role="img" [attr.aria-label]="'Không thể tải ' + alt"><span>H ♡ Q</span></div>
      }
    </div>
  `,
  styles: [`
    :host, .media-frame, picture { display: block; width: 100%; height: 100%; }
    .media-frame { position: relative; overflow: hidden; background: var(--surface-soft); }
    img { width: 100%; height: 100%; object-fit: cover; }
    .video-placeholder, .image-placeholder { display: grid; width: 100%; height: 100%; place-items: center; background: linear-gradient(145deg, #3c242a, #6c3341); color: #fffdf9; }
    .video-placeholder { align-content: center; gap: .5rem; }
    .video-placeholder span { display: grid; width: 3rem; height: 3rem; place-items: center; border: 1px solid rgba(255,255,255,.5); border-radius: 50%; padding-left: .12rem; }
    .video-placeholder small { font-size: .68rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
    .image-placeholder { color: var(--wine); background: repeating-linear-gradient(-45deg, #f0e3d8 0 10px, #f8f4ee 10px 20px); font-size: .75rem; letter-spacing: .12em; }
  `]
})
export class MediaFrameComponent {
  @Input({ required: true }) media!: MemoryMedia;
  @Input({ required: true }) alt = 'Ảnh kỷ niệm';
  @Input() priority = false;
  @Input() sizes = '(max-width: 700px) 100vw, 40vw';

  protected failed = false;

  protected get srcSet(): string | undefined {
    if (!this.media.thumbnailSrc || !this.media.displaySrc || !this.media.mediumSrc) return undefined;
    return `${this.media.thumbnailSrc} 480w, ${this.media.displaySrc} 960w, ${this.media.mediumSrc} 1440w`;
  }

  /** Keep high-density phones on the 960px rendition for in-page cards. */
  protected get mobileSrcSet(): string | undefined {
    if (!this.media.thumbnailSrc || !this.media.displaySrc) return undefined;
    return `${this.media.thumbnailSrc} 480w, ${this.media.displaySrc} 960w`;
  }

  protected get aspectRatio(): string {
    if (this.media.width && this.media.height) return `${this.media.width} / ${this.media.height}`;
    return this.media.kind === 'video' ? '16 / 10' : '4 / 5';
  }
}
