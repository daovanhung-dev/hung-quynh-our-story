import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Memory } from '../../../core/models/memory.model';
import { MemoryService } from '../../../core/services/memory.service';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';
import { MediaFrameComponent } from '../media-frame/media-frame.component';

@Component({
  selector: 'app-memory-card',
  standalone: true,
  imports: [RouterLink, MediaFrameComponent, RevealOnScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="memory-card" [class.featured]="featured" appRevealOnScroll>
      <a class="cover-link" [routerLink]="['/memory',memory.id]" [attr.aria-label]="'Mở kỷ niệm ngày ' + formatDate(memory.date)">
        <div class="image-shell">
          <app-media-frame [media]="memory.cover" [alt]="coverAlt" [priority]="priority" [sizes]="featured ? '(max-width:700px) 100vw,62vw' : '(max-width:700px) 100vw,32vw'" />
          <span class="media-count">{{ memory.images.length }} khoảnh khắc</span>
        </div>
      </a>
      <div class="card-copy">
        <p class="card-index">{{ featured ? 'Mở chương' : 'Một ngày của chúng mình' }}</p>
        <time [attr.datetime]="memory.date">{{ formatDate(memory.date) }}</time>
        @if (memory.title) { <h3>{{ memory.title }}</h3> }
        @if (memory.caption) { <p class="caption">{{ memory.caption }}</p> }
        @if (memory.location) { <p class="location">{{ memory.location }}</p> }
        <a class="open-link" [routerLink]="['/memory',memory.id]">Mở ngày hôm ấy <span aria-hidden="true">↗</span></a>
      </div>
    </article>
  `,
  styles: [`
    .memory-card { display:grid; gap:1rem; min-width:0; }
    .cover-link { display:block; color:inherit; text-decoration:none; }
    .image-shell { position:relative; overflow:hidden; aspect-ratio:4/5; background:var(--surface-soft); }
    .featured .image-shell { aspect-ratio:16/10; }
    .image-shell app-media-frame { transition:transform 420ms var(--ease-out); }
    .cover-link:hover app-media-frame { transform:scale(1.012); }
    .media-count { position:absolute; right:.75rem; bottom:.75rem; padding:.38rem .5rem; border:1px solid rgba(255,253,249,.5); background:rgba(43,32,35,.62); color:#fffdf9; font-size:.62rem; letter-spacing:.05em; }
    .card-copy { display:grid; justify-items:start; gap:.34rem; padding:.1rem; }
    .card-index { margin:0; color:var(--wine); font-size:.62rem; font-weight:600; letter-spacing:.14em; text-transform:uppercase; }
    time { color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(1.3rem,2.2vw,1.9rem); line-height:1.1; }
    h3,.caption,.location { margin:0; }
    h3 { font-family:var(--font-display); font-size:1.16rem; font-weight:400; }
    .caption { color:var(--text-secondary); font-size:.83rem; line-height:1.65; }
    .location { color:var(--text-muted); font-size:.76rem; }
    .open-link { display:inline-flex; align-items:center; min-height:40px; gap:.4rem; margin-top:.05rem; color:var(--wine); font-size:.66rem; font-weight:600; letter-spacing:.08em; text-decoration:none; text-transform:uppercase; opacity:.72; transition:opacity 180ms ease; }
    .memory-card:hover .open-link { opacity:1; }
    @media (max-width:620px) { .open-link { display:none; } .media-count { font-size:.58rem; } }
  `]
})
export class MemoryCardComponent {
  private readonly memoryService = inject(MemoryService);
  @Input({ required:true }) memory!: Memory;
  @Input() featured=false;
  @Input() priority=false;
  protected get coverAlt(): string { return this.memory.cover.alt || this.memory.title || `Kỷ niệm ngày ${this.memoryService.formatDate(this.memory.date)}`; }
  protected formatDate(date:string): string { return this.memoryService.formatDate(date); }
}
