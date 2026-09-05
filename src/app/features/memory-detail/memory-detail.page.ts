import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Memory } from '../../core/models/memory.model';
import { MemoryService } from '../../core/services/memory.service';
import { MediaFrameComponent } from '../../shared/components/media-frame/media-frame.component';
import { PhotoViewerComponent } from '../../shared/components/photo-viewer/photo-viewer.component';

@Component({
  standalone: true,
  imports: [RouterLink, MediaFrameComponent, PhotoViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (memory; as item) {
      <article class="memory-page">
        <a class="back" routerLink="/timeline">← Trở lại dòng thời gian</a>
        <header class="essay-header">
          <p class="eyebrow">Photo essay · {{ item.images.length }} khoảnh khắc</p>
          <time [attr.datetime]="item.date">{{ formatDate(item.date) }}</time>
          @if (item.title) { <h1>{{ item.title }}</h1> }
          @if (item.caption) { <p class="caption">{{ item.caption }}</p> }
          @if (item.location) { <p class="location">{{ item.location }}</p> }
        </header>
        <section class="essay" aria-label="Ảnh kỷ niệm">
          @for (media of item.images; track media.id; let index = $index) {
            <figure class="essay-frame" [class.cover]="index === 0" [class.portrait]="isPortrait(media.width, media.height)" [class.wide]="!isPortrait(media.width, media.height)">
              <button type="button" (click)="openViewer(index)" [attr.aria-label]="'Mở media ' + (index + 1) + ' của ngày ' + formatDate(item.date)">
                <app-media-frame [media]="media" [alt]="media.alt || 'Kỷ niệm ngày ' + formatDate(item.date)" [priority]="index === 0" [sizes]="index === 0 ? '100vw' : '(max-width: 720px) 100vw, 72vw'" />
              </button>
              @if (media.caption) { <figcaption>{{ media.caption }}</figcaption> }
            </figure>
          }
        </section>
      </article>
      @if (viewerOpen) { <app-photo-viewer [images]="item.images" [initialIndex]="viewerIndex" (closed)="closeViewer()" /> }
    } @else {
      <section class="missing">
        <span aria-hidden="true">H ♡ Q</span>
        <h1>Kỷ niệm này chưa ở trong cuốn lưu ký.</h1>
        <a routerLink="/timeline">Trở lại những ngày của chúng mình</a>
      </section>
    }
  `,
  styles: [`
    .memory-page { width: min(1280px, calc(100% - 3rem)); margin: 0 auto; padding: clamp(2.5rem, 6vw, 5rem) 0 7rem; }
    .back { display: inline-flex; min-height: 44px; align-items: center; margin-bottom: clamp(3rem, 8vw, 7rem); color: var(--wine); font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-decoration: none; text-transform: uppercase; }
    .essay-header { max-width: 840px; margin: 0 auto clamp(3rem, 9vw, 8rem); text-align: center; }
    .eyebrow { margin: 0 0 1rem; color: var(--wine); font-size: .68rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
    time { display: block; color: var(--text-secondary); font-family: var(--font-display); font-size: clamp(2.1rem, 5vw, 4.8rem); line-height: .96; }
    h1 { margin: .7rem 0 1.1rem; font-family: var(--font-display); font-size: clamp(1.7rem, 3.2vw, 3rem); font-weight: 400; line-height: 1.15; }
    .caption { max-width: 650px; margin: 0 auto; color: var(--text-secondary); font-family: var(--font-display); font-size: clamp(1.1rem, 2.1vw, 1.5rem); line-height: 1.6; }
    .location { margin: 1rem 0 0; color: var(--text-muted); font-size: .78rem; }
    .essay { display: grid; gap: clamp(2.25rem, 6vw, 6rem); }
    .essay-frame { width: min(72vw, 820px); margin: 0 auto; }
    .essay-frame.cover, .essay-frame.wide { width: min(100%, 1240px); }
    .essay-frame:nth-child(3n) { margin-left: 0; }
    .essay-frame:nth-child(4n) { margin-right: 0; }
    figure { margin-top: 0; margin-bottom: 0; }
    button { display: block; width: 100%; padding: 0; overflow: hidden; border: 0; background: var(--surface-soft); cursor: zoom-in; }
    app-media-frame { display: block; min-height: 200px; }
    button app-media-frame { transition: transform 360ms var(--ease-out); }
    button:hover app-media-frame { transform: scale(1.008); }
    figcaption { max-width: 580px; margin: .8rem auto 0; color: var(--text-muted); font-size: .78rem; line-height: 1.65; text-align: center; }
    .missing { display: grid; min-height: 70dvh; place-items: center; align-content: center; padding: 2rem; text-align: center; }
    .missing span { color: var(--wine); font-size: .7rem; font-weight: 600; letter-spacing: .16em; }
    .missing h1 { max-width: 600px; font-size: clamp(2.2rem, 6vw, 4.8rem); }
    .missing a { min-height: 44px; color: var(--wine); }
    @media (max-width: 720px) { .memory-page { width: calc(100% - 2rem); padding-bottom: 4rem; } .essay-header { text-align: left; } .caption { margin-left: 0; } .essay-frame, .essay-frame.cover, .essay-frame.wide { width: 100%; } .essay-frame:nth-child(3n), .essay-frame:nth-child(4n) { margin-left: auto; margin-right: auto; } }
  `]
})
export class MemoryDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly memoryService = inject(MemoryService);
  protected readonly memory: Memory | undefined = this.memoryService.getMemoryById(this.route.snapshot.paramMap.get('id') ?? '');
  protected viewerOpen = false;
  protected viewerIndex = 0;
  protected formatDate(date: string): string { return this.memoryService.formatDate(date); }
  protected isPortrait(width?: number, height?: number): boolean { return Boolean(width && height && height > width); }
  protected openViewer(index: number): void { this.viewerIndex = index; this.viewerOpen = true; }
  protected closeViewer(): void { this.viewerOpen = false; }
}
