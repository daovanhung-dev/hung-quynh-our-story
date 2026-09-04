import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Memory } from '../../../core/models/memory.model';
import { MemoryService } from '../../../core/services/memory.service';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

@Component({
  selector: 'app-memory-card',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="memory-card" appRevealOnScroll>
      <a class="cover-link" [routerLink]="['/memory', memory.id]">
        <div class="image-shell">
          @if (memory.coverKind !== 'video') {
            <img
              [src]="memory.cover"
              [alt]="memory.title || ('Kỷ niệm ' + memory.date)"
              loading="lazy"
              decoding="async"
            >
          }
          @if (memory.coverKind === 'video') {
            <video
              [src]="memory.cover"
              [poster]="memory.coverPosterSrc"
              muted
              playsinline
              preload="none"
              aria-label="Video kỷ niệm"
            ></video>
          }
          @if (memory.images.length > 1) {
            <span class="photo-count">{{ memory.images.length }} media</span>
          }
        </div>
      </a>

      <div class="card-copy">
        <time [attr.datetime]="memory.date">{{ formatDate(memory.date) }}</time>
        @if (memory.title) {
          <h3><a [routerLink]="['/memory', memory.id]">{{ memory.title }}</a></h3>
        }
        @if (memory.caption) {
          <p>{{ memory.caption }}</p>
        }
        @if (memory.location) {
          <span class="location">⌖ {{ memory.location }}</span>
        }
      </div>
    </article>
  `,
  styles: [`
    .memory-card { display: grid; gap: 1rem; }
    .cover-link, h3 a { color: inherit; text-decoration: none; }

    .image-shell {
      position: relative;
      overflow: hidden;
      aspect-ratio: 4 / 3;
      border-radius: var(--radius-xl);
      background: var(--surface-muted);
      box-shadow: var(--shadow-soft);
    }

    img, video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 420ms var(--ease-soft), filter 420ms var(--ease-soft);
    }

    .cover-link:hover img, .cover-link:hover video { transform: scale(1.018); }

    .photo-count {
      position: absolute;
      right: .75rem;
      bottom: .75rem;
      padding: .35rem .6rem;
      border: 1px solid rgba(255,255,255,.2);
      border-radius: 999px;
      background: rgba(22,18,18,.58);
      color: white;
      font-size: .75rem;
      backdrop-filter: blur(8px);
    }

    .card-copy { display: grid; gap: .45rem; padding-inline: .15rem; }
    time, .location { color: var(--text-muted); font-size: .8rem; }
    h3 { margin: 0; font-family: var(--font-display); font-size: clamp(1.3rem, 2.5vw, 1.8rem); line-height: 1.15; }
    p { margin: 0; color: var(--text-secondary); line-height: 1.65; }
  `]
})
export class MemoryCardComponent {
  private readonly memoryService = inject(MemoryService);

  @Input({ required: true }) memory!: Memory;

  protected formatDate(date: string): string {
    return this.memoryService.formatDate(date);
  }
}
