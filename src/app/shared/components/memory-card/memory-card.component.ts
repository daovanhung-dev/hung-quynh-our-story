import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Memory } from '../../../core/models/memory.model';
import { MemoryService } from '../../../core/services/memory.service';
import { MediaFrameComponent } from '../media-frame/media-frame.component';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

@Component({
  selector: 'app-memory-card',
  standalone: true,
  imports: [RouterLink, MediaFrameComponent, RevealOnScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="memory-card" [class.featured]="featured" appRevealOnScroll>
      <a class="cover-link" [routerLink]="['/memory', memory.id]" [attr.aria-label]="'Mở kỷ niệm ngày ' + formatDate(memory.date)">
        <div class="image-shell">
          <app-media-frame [media]="memory.cover" [alt]="coverAlt" [priority]="priority" [sizes]="featured ? '(max-width: 700px) 100vw, 62vw' : '(max-width: 700px) 100vw, 32vw'" />
          <span class="media-count">{{ memory.images.length }} {{ memory.images.length === 1 ? 'khoảnh khắc' : 'khoảnh khắc' }}</span>
        </div>
      </a>
      <div class="card-copy">
        <p class="card-index">{{ featured ? 'Mở chương' : 'Một ngày' }}</p>
        <time [attr.datetime]="memory.date">{{ formatDate(memory.date) }}</time>
        @if (memory.title) { <h3>{{ memory.title }}</h3> }
        @if (memory.caption) { <p class="caption">{{ memory.caption }}</p> }
        @if (memory.location) { <p class="location">{{ memory.location }}</p> }
        <a class="open-link" [routerLink]="['/memory', memory.id]">Xem câu chuyện <span aria-hidden="true">↗</span></a>
      </div>
    </article>
  `,
  styles: [`
    .memory-card { display: grid; gap: 1rem; min-width: 0; }
    .cover-link { display: block; color: inherit; text-decoration: none; }
    .image-shell { position: relative; overflow: hidden; aspect-ratio: 4 / 5; background: var(--surface-soft); }
    .featured .image-shell { aspect-ratio: 16 / 10; }
    .image-shell app-media-frame { transition: transform 320ms var(--ease-out); }
    .cover-link:hover app-media-frame { transform: scale(1.015); }
    .media-count { position: absolute; right: .8rem; bottom: .8rem; padding: .42rem .55rem; border: 1px solid rgba(255,253,249,.55); background: rgba(43,32,35,.72); color: #fffdf9; font-size: .66rem; letter-spacing: .05em; }
    .card-copy { display: grid; justify-items: start; gap: .35rem; padding: .15rem .1rem; }
    .card-index { margin: 0; color: var(--wine); font-size: .65rem; font-weight: 600; letter-spacing: .15em; text-transform: uppercase; }
    time { color: var(--text-secondary); font-family: var(--font-display); font-size: clamp(1.22rem, 2vw, 1.7rem); line-height: 1.1; }
    h3, .caption, .location { margin: 0; }
    h3 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 400; }
    .caption { color: var(--text-secondary); font-size: .85rem; line-height: 1.65; }
    .location { color: var(--text-muted); font-size: .78rem; }
    .open-link { display: inline-flex; align-items: center; min-height: 44px; gap: .45rem; margin-top: .2rem; color: var(--wine); font-size: .7rem; font-weight: 600; letter-spacing: .09em; text-decoration: none; text-transform: uppercase; }
    .open-link span { font-size: 1rem; }
  `]
})
export class MemoryCardComponent {
  private readonly memoryService = inject(MemoryService);

  @Input({ required: true }) memory!: Memory;
  @Input() featured = false;
  @Input() priority = false;

  protected get coverAlt(): string {
    return this.memory.cover.alt || this.memory.title || `Kỷ niệm ngày ${this.memoryService.formatDate(this.memory.date)}`;
  }

  protected formatDate(date: string): string {
    return this.memoryService.formatDate(date);
  }
}
