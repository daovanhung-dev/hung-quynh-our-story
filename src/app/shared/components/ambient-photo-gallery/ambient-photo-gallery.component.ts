import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { MemoryMedia } from '../../../core/models/memory.model';
import { MediaFrameComponent } from '../media-frame/media-frame.component';

export type AmbientPhotoLayout = 'cluster' | 'rail' | 'side' | 'single';

@Component({
  selector: 'app-ambient-photo-gallery',
  standalone: true,
  imports: [MediaFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="'ambient-gallery ambient-gallery--' + layout"
      [attr.aria-hidden]="decorative ? 'true' : null"
    >
      @for (photo of photos; track photo.id; let index = $index) {
        <figure
          class="ambient-photo"
          [attr.data-photo-id]="photo.id"
          [style.--photo-index]="index"
          [style.--photo-count]="photos.length"
        >
          <app-media-frame
            [media]="photo"
            [alt]="decorative ? '' : (photo.alt || 'Ảnh kỷ niệm')"
            [priority]="index < priorityCount"
            [sizes]="sizes"
          />
        </figure>
      }
    </div>
  `,
  styles: [`
    :host { position: relative; z-index: 0; display: block; pointer-events: none; }
    .ambient-gallery { position: relative; width: 100%; height: 100%; }
    .ambient-photo { position: relative; min-width: 0; margin: 0; overflow: hidden; transform: translate3d(0,0,0) rotate(var(--photo-rotation, 0deg)); transform-origin: 50% 70%; will-change: transform, opacity; }
    .ambient-photo app-media-frame { display: block; width: 100%; height: 100%; }
    .ambient-photo::after { position: absolute; inset: 0; border: 1px solid rgba(255,253,249,.22); content: ''; pointer-events: none; }

    .ambient-gallery--cluster { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-rows: repeat(8, minmax(0, 1fr)); gap: .7rem; }
    .ambient-gallery--cluster .ambient-photo { grid-column: span 4; grid-row: span 5; padding: .34rem .34rem 1rem; background: #fffaf1; box-shadow: 0 18px 50px rgba(43,32,35,.18); }
    .ambient-gallery--cluster .ambient-photo:nth-child(1) { grid-column: 1 / span 5; grid-row: 1 / span 6; --photo-rotation: -5deg; }
    .ambient-gallery--cluster .ambient-photo:nth-child(2) { grid-column: 5 / span 4; grid-row: 3 / span 5; --photo-rotation: 4deg; }
    .ambient-gallery--cluster .ambient-photo:nth-child(3) { grid-column: 9 / span 4; grid-row: 1 / span 5; --photo-rotation: 7deg; }
    .ambient-gallery--cluster .ambient-photo:nth-child(4) { grid-column: 3 / span 4; grid-row: 6 / span 3; --photo-rotation: -2deg; }
    .ambient-gallery--cluster .ambient-photo:nth-child(5) { grid-column: 8 / span 4; grid-row: 6 / span 3; --photo-rotation: 3deg; }

    .ambient-gallery--rail { display: flex; align-items: center; gap: clamp(.6rem, 2vw, 1.3rem); overflow: hidden; padding: .5rem 0 1rem; }
    .ambient-gallery--rail .ambient-photo { flex: 0 0 clamp(7rem, 18vw, 13rem); aspect-ratio: 4 / 5; padding: .28rem .28rem .85rem; background: #fffaf1; box-shadow: 0 16px 35px rgba(43,32,35,.12); }
    .ambient-gallery--rail .ambient-photo:nth-child(even) { --photo-rotation: 3deg; transform: translateY(.55rem) rotate(var(--photo-rotation)); }
    .ambient-gallery--rail .ambient-photo:nth-child(odd) { --photo-rotation: -3deg; }

    .ambient-gallery--side { display: flex; align-items: center; justify-content: space-between; gap: clamp(1rem, 5vw, 5rem); }
    .ambient-gallery--side .ambient-photo { flex: 0 1 clamp(6rem, 15vw, 13rem); aspect-ratio: 4 / 5; padding: .3rem .3rem .9rem; background: #fffaf1; box-shadow: 0 20px 48px rgba(43,32,35,.16); }
    .ambient-gallery--side .ambient-photo:first-child { --photo-rotation: -7deg; }
    .ambient-gallery--side .ambient-photo:nth-child(2) { --photo-rotation: 6deg; transform: translateY(1.1rem) rotate(var(--photo-rotation)); }
    .ambient-gallery--side .ambient-photo:nth-child(3) { --photo-rotation: -3deg; }

    .ambient-gallery--single { display: grid; place-items: center; }
    .ambient-gallery--single .ambient-photo { width: min(100%, 22rem); aspect-ratio: 4 / 5; padding: .38rem .38rem 1.15rem; background: #fffaf1; box-shadow: 0 24px 70px rgba(43,32,35,.22); }

    @media (prefers-reduced-motion: no-preference) {
      .ambient-photo { animation: ambient-float 7s ease-in-out calc(var(--photo-index) * 140ms) infinite alternate; }
      .ambient-gallery--rail .ambient-photo:nth-child(even), .ambient-gallery--side .ambient-photo:nth-child(2) { animation-name: ambient-float-offset; }
    }

    @supports (animation-timeline: scroll()) {
      @media (min-width: 900px) and (prefers-reduced-motion: no-preference) {
        .ambient-gallery--cluster .ambient-photo, .ambient-gallery--side .ambient-photo { animation-name: ambient-parallax; animation-duration: 1ms; animation-iteration-count: 1; animation-timeline: scroll(root block); animation-range: entry 0% cover 65%; }
      }
    }

    @keyframes ambient-float {
      from { transform: translate3d(0, 0, 0) rotate(var(--photo-rotation, 0deg)); }
      to { transform: translate3d(0, -7px, 0) rotate(calc(var(--photo-rotation, 0deg) + 1deg)); }
    }
    @keyframes ambient-float-offset {
      from { transform: translate3d(0, 1rem, 0) rotate(var(--photo-rotation, 0deg)); }
      to { transform: translate3d(0, calc(1rem - 7px), 0) rotate(calc(var(--photo-rotation, 0deg) - 1deg)); }
    }
    @keyframes ambient-parallax {
      from { transform: translate3d(0, 18px, 0) rotate(var(--photo-rotation, 0deg)); }
      to { transform: translate3d(0, -18px, 0) rotate(calc(var(--photo-rotation, 0deg) + 1deg)); }
    }

    @media (max-width: 640px) {
      .ambient-gallery--cluster { gap: .38rem; }
      .ambient-gallery--cluster .ambient-photo { padding: .2rem .2rem .65rem; }
      .ambient-gallery--side { gap: .5rem; }
      .ambient-gallery--side .ambient-photo { flex-basis: 27vw; padding: .22rem .22rem .65rem; }
      .ambient-gallery--rail .ambient-photo { flex-basis: 24vw; }
    }

    @media (prefers-reduced-motion: reduce) {
      .ambient-photo, .ambient-gallery--rail .ambient-photo:nth-child(even), .ambient-gallery--side .ambient-photo:nth-child(2) { animation: none; transform: rotate(var(--photo-rotation, 0deg)); }
    }
  `]
})
export class AmbientPhotoGalleryComponent {
  @Input({ required: true }) photos: readonly MemoryMedia[] = [];
  @Input() layout: AmbientPhotoLayout = 'cluster';
  @Input() decorative = true;
  @Input() priorityCount = 1;
  @Input() sizes = '(max-width: 640px) 34vw, 18vw';
}
