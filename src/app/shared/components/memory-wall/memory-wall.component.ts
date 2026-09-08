import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import type { MemoryMedia } from '../../../core/models/memory.model';
import { MemoryService } from '../../../core/services/memory.service';
import { MediaFrameComponent } from '../media-frame/media-frame.component';

interface MemoryWallPlacement {
  left: number;
  top: number;
  width: number;
  rotation: number;
  scale: number;
  opacity: number;
  depth: number;
  delayMs: number;
}

interface MemoryWallPhoto extends MemoryWallPlacement {
  media: MemoryMedia;
}

const WALL_PLACEMENTS: readonly MemoryWallPlacement[] = [
  { left: 8, top: 16, width: 16, rotation: -9, scale: .78, opacity: .54, depth: 1, delayMs: 0 },
  { left: 22, top: 10, width: 19, rotation: 5, scale: .9, opacity: .68, depth: 2, delayMs: 180 },
  { left: 38, top: 16, width: 15, rotation: -4, scale: .74, opacity: .5, depth: 1, delayMs: 320 },
  { left: 57, top: 13, width: 19, rotation: 8, scale: .88, opacity: .66, depth: 2, delayMs: 460 },
  { left: 75, top: 15, width: 15, rotation: -6, scale: .76, opacity: .5, depth: 1, delayMs: 620 },
  { left: 91, top: 22, width: 17, rotation: 7, scale: .82, opacity: .58, depth: 1, delayMs: 780 },
  { left: 12, top: 42, width: 22, rotation: 4, scale: .96, opacity: .78, depth: 3, delayMs: 120 },
  { left: 29, top: 34, width: 17, rotation: -7, scale: .8, opacity: .56, depth: 2, delayMs: 280 },
  { left: 70, top: 35, width: 18, rotation: -3, scale: .86, opacity: .64, depth: 2, delayMs: 420 },
  { left: 88, top: 44, width: 22, rotation: 6, scale: .95, opacity: .76, depth: 3, delayMs: 560 },
  { left: 9, top: 69, width: 16, rotation: -5, scale: .76, opacity: .5, depth: 1, delayMs: 700 },
  { left: 24, top: 76, width: 21, rotation: 8, scale: .92, opacity: .7, depth: 2, delayMs: 840 },
  { left: 41, top: 84, width: 15, rotation: -8, scale: .76, opacity: .48, depth: 1, delayMs: 100 },
  { left: 59, top: 79, width: 21, rotation: 4, scale: .94, opacity: .72, depth: 3, delayMs: 260 },
  { left: 77, top: 73, width: 16, rotation: -6, scale: .78, opacity: .52, depth: 1, delayMs: 400 },
  { left: 93, top: 81, width: 20, rotation: 9, scale: .9, opacity: .66, depth: 2, delayMs: 540 },
  { left: 35, top: 55, width: 14, rotation: 5, scale: .72, opacity: .42, depth: 1, delayMs: 680 },
  { left: 64, top: 56, width: 15, rotation: -5, scale: .75, opacity: .46, depth: 1, delayMs: 820 }
];

@Component({
  selector: 'app-memory-wall',
  standalone: true,
  imports: [MediaFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="memory-wall" aria-hidden="true">
      @for (photo of activePhotos(); track photo.media.id) {
        <figure
          class="memory-wall-photo"
          [attr.data-photo-id]="photo.media.id"
          [style.--photo-left]="photo.left + '%'"
          [style.--photo-top]="photo.top + '%'"
          [style.--photo-width]="photo.width + '%'"
          [style.--photo-rotation]="photo.rotation + 'deg'"
          [style.--photo-scale]="photo.scale"
          [style.--photo-opacity]="photo.opacity"
          [style.--photo-depth]="photo.depth"
          [style.--photo-delay]="photo.delayMs + 'ms'"
          [style.z-index]="photo.depth"
        >
          <app-media-frame [media]="photo.media" alt="" [priority]="photo.depth >= 3" sizes="(max-width: 680px) 26vw, 18vw" />
        </figure>
      } @empty {
        <div class="memory-wall-empty">H ♡ Q</div>
      }
    </div>
  `,
  styles: [`
    :host { position:absolute; inset:0; display:block; }
    .memory-wall { position:relative; width:100%; height:100%; overflow:hidden; perspective:1200px; }
    .memory-wall-photo { position:absolute; left:var(--photo-left); top:var(--photo-top); width:var(--photo-width); margin:0; padding:.32rem .32rem 1.05rem; overflow:hidden; background:#fffaf1; box-shadow:0 18px 45px rgba(43,32,35,.16); opacity:var(--photo-opacity); transform:translate3d(-50%,-50%,0) rotate(var(--photo-rotation)) scale(var(--photo-scale)); transform-origin:50% 70%; will-change:transform,opacity; }
    .memory-wall-photo app-media-frame { display:block; aspect-ratio:4 / 5; }
    .memory-wall-photo::after { position:absolute; inset:0; border:1px solid rgba(127,59,75,.14); content:''; pointer-events:none; }
    .memory-wall-empty { display:grid; width:100%; height:100%; place-items:center; color:rgba(123,53,73,.35); font-size:.8rem; font-weight:600; letter-spacing:.16em; }

    @media (prefers-reduced-motion:no-preference) {
      .memory-wall-photo { animation:memory-wall-float 8s ease-in-out var(--photo-delay) infinite alternate; }
    }

    @keyframes memory-wall-float {
      from { transform:translate3d(-50%,-50%,0) rotate(var(--photo-rotation)) scale(var(--photo-scale)); }
      to { transform:translate3d(-50%,calc(-50% - 6px),0) rotate(calc(var(--photo-rotation) + 1deg)) scale(var(--photo-scale)); }
    }

    @media (max-width:680px) {
      .memory-wall-photo { padding:.2rem .2rem .7rem; }
    }

    @media (prefers-reduced-motion:reduce) {
      .memory-wall-photo { animation:none; }
    }
  `]
})
export class MemoryWallComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly memoryService = inject(MemoryService);
  private mediaQuery?: MediaQueryList;

  protected readonly photoPool = this.memoryService.getRandomImageMedia(WALL_PLACEMENTS.length);
  protected readonly activeLimit = signal(WALL_PLACEMENTS.length);
  protected readonly activePhotos = signal<readonly MemoryWallPhoto[]>([]);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.mediaQuery = window.matchMedia('(max-width: 680px)');
      this.mediaQuery.addEventListener('change', this.onViewportChange);
      this.activeLimit.set(this.mediaQuery.matches ? 10 : WALL_PLACEMENTS.length);
    }
    this.refreshPhotos();
  }

  ngOnDestroy(): void {
    this.mediaQuery?.removeEventListener('change', this.onViewportChange);
  }

  private readonly onViewportChange = (event: MediaQueryListEvent): void => {
    this.activeLimit.set(event.matches ? 10 : WALL_PLACEMENTS.length);
    this.refreshPhotos();
  };

  private refreshPhotos(): void {
    const limit = Math.min(this.activeLimit(), this.photoPool.length);
    this.activePhotos.set(this.photoPool.slice(0, limit).map((media, index) => ({
      media,
      ...WALL_PLACEMENTS[index]
    })));
  }
}
