import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MemoryService } from '../../core/services/memory.service';
import { AmbientPhotoGalleryComponent } from '../../shared/components/ambient-photo-gallery/ambient-photo-gallery.component';

@Component({
  standalone: true,
  imports: [RouterLink, AmbientPhotoGalleryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <p class="eyebrow">Hùng ♡ Quỳnh · 404</p>
      <div class="not-found-photo">
        <app-ambient-photo-gallery [photos]="photos" layout="single" sizes="min(70vw, 22rem)" />
      </div>
      <span class="mark">♡</span>
      <h1>Trang này đang trốn đâu đó.</h1>
      <p class="description">Kỷ niệm em tìm chưa ở đây.</p>
      <a routerLink="/timeline">Về dòng thời gian <span aria-hidden="true">↗</span></a>
    </section>
  `,
  styles: [`
    section { display: grid; place-items: center; align-content: center; min-height: 72dvh; padding: 2rem; text-align: center; }
    .not-found-photo { width:min(100%,22rem); height:clamp(12rem,30vw,19rem); margin:0 auto 1rem; }
    .eyebrow { margin: 0 0 1.2rem; color: var(--accent-deep); font-size: .72rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
    .mark { color: var(--accent); font-family: var(--font-display); font-size: 4rem; }
    h1 { max-width: 760px; margin: .5rem 0 .8rem; font-family: var(--font-display); font-size: clamp(2.8rem, 7vw, 6rem); font-weight: 400; line-height: .9; letter-spacing: -.06em; }
    .description { margin: 0 0 1.4rem; color: var(--text-secondary); }
    a { display: inline-flex; align-items: center; gap: .5rem; color: var(--accent-deep); font-weight: 700; text-decoration: none; }
    a span { font-family: var(--font-body); font-size: 1rem; }
    @media (max-width:620px) { section { min-height:70dvh; } .not-found-photo { height:14rem; } }
  `]
})
export class NotFoundPage {
  private readonly memoryService = inject(MemoryService);
  protected readonly photos = this.memoryService.getRandomImageMedia(1);
}
