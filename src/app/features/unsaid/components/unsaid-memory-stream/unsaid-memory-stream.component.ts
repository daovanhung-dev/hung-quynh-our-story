import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import type { MemoryMedia } from '../../../../core/models/memory.model';
import { MemoryService } from '../../../../core/services/memory.service';
import { MediaFrameComponent } from '../../../../shared/components/media-frame/media-frame.component';

interface MemoryStreamFrame {
  readonly key: string;
  readonly photo: MemoryMedia;
  readonly left: string;
  readonly top: string;
  readonly rotation: number;
  readonly duration: number;
}

const STREAM_ANCHORS = [
  { left: '2%', top: '8%' },
  { left: '7%', top: '33%' },
  { left: '3%', top: '68%' },
  { left: '84%', top: '12%' },
  { left: '89%', top: '41%' },
  { left: '82%', top: '74%' },
  { left: '20%', top: '18%' },
  { left: '71%', top: '63%' }
] as const;

@Component({
  selector: 'app-unsaid-memory-stream',
  standalone: true,
  imports: [MediaFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="memory-stream" aria-hidden="true">
      @for (frame of frames(); track frame.key) {
        <figure
          class="memory-stream-photo"
          [attr.data-photo-id]="frame.photo.id"
          [style.left]="frame.left"
          [style.top]="frame.top"
          [style.--photo-rotation]="frame.rotation + 'deg'"
          [style.--photo-duration]="frame.duration + 'ms'"
        >
          <app-media-frame [media]="frame.photo" alt="" [sizes]="'(max-width: 680px) 24vw, 14vw'" />
        </figure>
      }
    </div>
  `,
  styles: [`
    :host { position:absolute; inset:0; z-index:0; display:block; overflow:hidden; pointer-events:none; }
    .memory-stream { position:absolute; inset:0; overflow:hidden; }
    .memory-stream-photo { position:absolute; width:clamp(5.5rem,13vw,11.5rem); aspect-ratio:4 / 5; margin:0; padding:.3rem .3rem .85rem; border:1px solid rgba(127,59,75,.13); background:rgba(255,250,241,.72); box-shadow:0 18px 50px rgba(43,32,35,.13); opacity:0; filter:saturate(.78) sepia(.08); transform:translate3d(0,24px,0) rotate(var(--photo-rotation)) scale(.94); animation:memory-stream-in-out var(--photo-duration) ease-in-out both; }
    .memory-stream-photo::after { position:absolute; inset:0; border:1px solid rgba(255,253,249,.3); content:''; }
    .memory-stream-photo app-media-frame { display:block; width:100%; height:100%; }

    @keyframes memory-stream-in-out {
      0%, 100% { opacity:0; transform:translate3d(0,24px,0) rotate(var(--photo-rotation)) scale(.94); }
      13% { opacity:.28; transform:translate3d(0,0,0) rotate(var(--photo-rotation)) scale(1); }
      64% { opacity:.28; transform:translate3d(0,-8px,0) rotate(calc(var(--photo-rotation) + 1deg)) scale(1.01); }
      86% { opacity:0; transform:translate3d(0,-20px,0) rotate(calc(var(--photo-rotation) + 2deg)) scale(.97); }
    }

    @media (max-width:680px) {
      .memory-stream-photo { width:clamp(4.8rem,22vw,7rem); padding:.2rem .2rem .6rem; box-shadow:0 12px 30px rgba(43,32,35,.1); }
    }

    @media (prefers-reduced-motion:reduce) {
      .memory-stream-photo { opacity:.12; animation:none; transform:rotate(var(--photo-rotation)); }
    }
  `]
})
export class UnsaidMemoryStreamComponent implements OnInit, OnDestroy {
  private readonly memoryService = inject(MemoryService);
  private readonly allPhotos = this.memoryService.getAllImageMedia();
  private photoPool: readonly MemoryMedia[] = [];
  private poolIndex = 0;
  private sequence = 0;
  private readonly timers: Array<ReturnType<typeof setTimeout> | undefined> = [];

  protected readonly frames = signal<readonly MemoryStreamFrame[]>([]);

  ngOnInit(): void {
    const frameCount = Math.min(4, this.allPhotos.length);
    const initialFrames = Array.from({ length: frameCount }, (_, slot) => this.createFrame(slot));
    const frames = initialFrames.filter((frame): frame is MemoryStreamFrame => frame !== undefined);
    this.frames.set(frames);

    frames.forEach((frame, slot) => this.scheduleNext(slot, frame.duration));
  }

  ngOnDestroy(): void {
    this.timers.forEach((timer) => {
      if (timer !== undefined) clearTimeout(timer);
    });
  }

  private createFrame(slot: number): MemoryStreamFrame | undefined {
    const photo = this.takeNextPhoto();
    if (!photo) return undefined;

    const anchor = STREAM_ANCHORS[(slot + Math.floor(Math.random() * STREAM_ANCHORS.length)) % STREAM_ANCHORS.length];
    return {
      key: `${photo.id}-${this.sequence++}`,
      photo,
      left: anchor.left,
      top: anchor.top,
      rotation: Math.round((Math.random() * 8 - 4) * 10) / 10,
      duration: 7200 + Math.floor(Math.random() * 3000)
    };
  }

  private takeNextPhoto(): MemoryMedia | undefined {
    if (this.poolIndex >= this.photoPool.length) {
      this.photoPool = this.shuffle(this.allPhotos);
      this.poolIndex = 0;
    }

    const photo = this.photoPool[this.poolIndex];
    this.poolIndex += 1;
    return photo;
  }

  private shuffle(photos: readonly MemoryMedia[]): readonly MemoryMedia[] {
    const shuffled = [...photos];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  private scheduleNext(slot: number, duration: number): void {
    this.timers[slot] = setTimeout(() => {
      const nextFrame = this.createFrame(slot);
      if (!nextFrame) return;

      this.frames.update((frames) => frames.map((frame, index) => index === slot ? nextFrame : frame));
      this.scheduleNext(slot, nextFrame.duration);
    }, duration);
  }
}
