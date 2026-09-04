import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
  inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { TimelineMonthGroup } from '../../../core/models/timeline.model';
import { MemoryService } from '../../../core/services/memory.service';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

@Component({
  selector: 'app-month-photo-rail',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="month-section" [attr.id]="group.monthKey" appRevealOnScroll>
      <div class="month-heading">
        <div>
          <p class="month-kicker">Dòng thời gian</p>
          <h3>{{ group.monthLabel }}</h3>
          <p class="month-meta">{{ group.photoCount }} ảnh trong tháng này</p>
        </div>

        <div class="controls">
          <button type="button" aria-label="Kéo sang trái" (click)="scrollByPage(-1)">←</button>
          <button type="button" aria-label="Kéo sang phải" (click)="scrollByPage(1)">→</button>
        </div>
      </div>

      <div class="rail-mask">
        <div
          #rail
          class="rail"
          aria-label="Thanh ảnh theo tháng"
          (pointerdown)="startDrag($event)"
          (pointermove)="moveDrag($event)"
          (pointerup)="endDrag()"
          (pointerleave)="endDrag()"
          (pointercancel)="endDrag()"
        >
          @for (photo of group.photos; track photo.id) {
            <article class="photo-card">
              <a [routerLink]="['/memory', photo.memoryId]">
                <div class="thumb">
                  <img [src]="photo.src" [alt]="photo.alt || photo.title || 'Ảnh kỷ niệm'" loading="lazy" decoding="async">
                </div>
                <span class="date">{{ formatDayMonth(photo.date) }}</span>
                @if (photo.title) {
                  <span class="title">{{ photo.title }}</span>
                }
              </a>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .month-section { display: grid; gap: 1.35rem; scroll-margin-top: 96px; }

    .month-heading {
      position: sticky;
      top: 76px;
      z-index: 3;
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 0 0.2rem;
      background: linear-gradient(180deg, color-mix(in srgb, var(--background) 92%, transparent) 0%, color-mix(in srgb, var(--background) 92%, transparent) 72%, transparent 100%);
      backdrop-filter: blur(10px);
    }

    .month-kicker,
    .month-meta,
    .date,
    .title { margin: 0; }
    .month-kicker {
      color: var(--accent-deep);
      font-size: .78rem;
      font-weight: 800;
      letter-spacing: .18em;
      text-transform: uppercase;
    }

    h3 {
      margin: .25rem 0;
      font-family: var(--font-display);
      font-size: clamp(2rem, 5vw, 4rem);
      letter-spacing: -.04em;
      line-height: .94;
    }

    .month-meta { color: var(--text-muted); font-size: .88rem; }

    .controls { display: flex; gap: .6rem; }
    .controls button {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: color-mix(in srgb, var(--surface) 86%, transparent);
      color: var(--text-primary);
      cursor: pointer;
      box-shadow: var(--shadow-soft);
    }

    .rail-mask {
      overflow: hidden;
      border-radius: calc(var(--radius-xl) + 4px);
    }

    .rail {
      --gap: 1rem;
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: calc((100% - (var(--gap) * 4)) / 5);
      gap: var(--gap);
      overflow-x: auto;
      padding: .35rem .2rem .9rem;
      scroll-snap-type: x proximity;
      scrollbar-width: none;
      cursor: grab;
      user-select: none;
      touch-action: pan-y;
    }
    .rail::-webkit-scrollbar { display: none; }
    .rail.dragging { cursor: grabbing; }

    .photo-card {
      min-width: 0;
      scroll-snap-align: start;
    }

    .photo-card a {
      display: grid;
      gap: .55rem;
      color: inherit;
      text-decoration: none;
    }

    .thumb {
      overflow: hidden;
      aspect-ratio: 4 / 5;
      border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
      border-radius: var(--radius-xl);
      background: var(--surface-muted);
      box-shadow: var(--shadow-soft);
    }

    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 340ms var(--ease-soft), filter 340ms var(--ease-soft);
    }

    .photo-card a:hover img { transform: scale(1.03); }
    .date {
      color: var(--text-muted);
      font-size: .8rem;
      line-height: 1.3;
    }

    .title {
      color: var(--text-secondary);
      font-size: .82rem;
      line-height: 1.45;
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    @media (max-width: 1100px) {
      .rail { grid-auto-columns: calc((100% - (var(--gap) * 2)) / 3); }
    }

    @media (max-width: 680px) {
      .month-heading { top: 72px; align-items: center; }
      .controls button { width: 38px; height: 38px; }
      .rail { grid-auto-columns: calc((100% - var(--gap)) / 2); }
    }
  `]
})
export class MonthPhotoRailComponent implements AfterViewInit {
  private readonly memoryService = inject(MemoryService);

  @ViewChild('rail', { static: true }) private readonly railRef?: ElementRef<HTMLDivElement>;
  @Input({ required: true }) group!: TimelineMonthGroup;

  private dragging = false;
  private pointerId = 0;
  private startX = 0;
  private startScrollLeft = 0;

  ngAfterViewInit(): void {
    this.syncDragClass(false);
  }

  protected formatDayMonth(date: string): string {
    return this.memoryService.formatDayMonth(date);
  }

  protected scrollByPage(direction: 1 | -1): void {
    const rail = this.railRef?.nativeElement;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.88, behavior: 'smooth' });
  }

  protected startDrag(event: PointerEvent): void {
    const rail = this.railRef?.nativeElement;
    if (!rail) return;

    this.dragging = true;
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startScrollLeft = rail.scrollLeft;
    rail.setPointerCapture(event.pointerId);
    this.syncDragClass(true);
  }

  protected moveDrag(event: PointerEvent): void {
    const rail = this.railRef?.nativeElement;
    if (!rail || !this.dragging || event.pointerId !== this.pointerId) return;

    const delta = event.clientX - this.startX;
    rail.scrollLeft = this.startScrollLeft - delta;
  }

  protected endDrag(): void {
    const rail = this.railRef?.nativeElement;
    if (!rail || !this.dragging) return;

    this.dragging = false;
    this.syncDragClass(false);
    try {
      rail.releasePointerCapture(this.pointerId);
    } catch {
      // no-op
    }
  }

  @HostListener('window:mouseup')
  protected onMouseUp(): void {
    this.endDrag();
  }

  private syncDragClass(enabled: boolean): void {
    const rail = this.railRef?.nativeElement;
    rail?.classList.toggle('dragging', enabled);
  }
}
