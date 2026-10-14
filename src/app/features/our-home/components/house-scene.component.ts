import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnChanges, OnDestroy, Output, signal, SimpleChanges } from '@angular/core';
import { HOUSE_ROOMS } from '../content/room-map.content';
import type { HouseHotspot, HouseRoom, HouseRoomId } from '../models/our-home.model';

@Component({
  selector: 'app-house-scene',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="scene-stage" [class]="'scene-stage mood-' + mood + (reducedMotion ? ' is-reduced-motion' : '') + (lampOn ? '' : ' is-lamp-off') + (room.id === 'entrance' && introStage === 'welcome' ? ' is-welcome' : '') + (room.id === 'entrance' && introStage === 'story' ? ' is-waking' : '')" [attr.data-room-id]="room.id" [attr.aria-label]="room.title" (pointerdown)="onPointerDown($event)" (pointerup)="onPointerUp($event)" (pointercancel)="clearPointer()">
      @if (!failedArtworkRooms().has(room.id)) {
        <img class="room-art" [attr.data-room-art]="room.id" [src]="artworkPath(room.id)" alt="" aria-hidden="true" draggable="false" fetchpriority="high" decoding="async" (load)="animateArtwork($event)" (error)="onArtworkError(room.id)">
      } @else {
        <div class="scene-fallback" aria-hidden="true"><span class="fallback-moon">☾</span><span class="fallback-home">⌂</span><span class="fallback-title">{{ room.title }}</span><span class="fallback-note">Một góc nhỏ dành cho chúng mình</span></div>
      }
      <div class="scene-wash" aria-hidden="true"></div>
      <div class="scene-hotspots" aria-label="Đồ vật có thể chạm">
        @for (hotspot of room.hotspots; track hotspot.id) {
          <button class="hotspot" type="button" [style.left.%]="hotspot.position.x" [style.top.%]="hotspot.position.y" [attr.data-hotspot-id]="hotspot.id" [attr.aria-label]="hotspot.label" (click)="activated.emit(hotspot)">
            <span class="hotspot-icon" aria-hidden="true">{{ hotspot.icon }}</span><span class="hotspot-label">{{ hotspot.visualLabel }}</span>
          </button>
        }
      </div>
      <p class="scene-hint" aria-hidden="true">Chạm vào những món đồ để khám phá</p>
    </section>
  `,
  styleUrl: './house-scene.component.scss'
})
export class HouseSceneComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) room!: HouseRoom;
  @Input({ required: true }) mood: 'dawn' | 'day' | 'sunset' | 'night' = 'day';
  @Input() reducedMotion = false;
  @Input() lampOn = true;
  @Input() introStage: 'welcome' | 'story' | 'done' = 'done';
  @Output() readonly activated = new EventEmitter<HouseHotspot>();
  @Output() readonly swiped = new EventEmitter<'previous' | 'next'>();
  private readonly vectorFallbackRooms = signal<ReadonlySet<HouseRoomId>>(new Set());
  protected readonly failedArtworkRooms = signal<ReadonlySet<HouseRoomId>>(new Set());
  private readonly document = inject(DOCUMENT);
  private readonly prefetchedRooms = new Set<HouseRoomId>();
  private pendingIdleHandle?: number;
  private pendingTimeoutHandle?: number;
  private pointerStart?: { id: number; x: number; y: number };

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['room'] || !this.room) return;
    this.scheduleNextArtworkPrefetch(this.room.id);
  }

  ngOnDestroy(): void {
    this.cancelScheduledPrefetch();
  }

  protected onPointerDown(event: PointerEvent): void {
    const target = event.target;
    if ((event.pointerType !== 'touch' && event.pointerType !== 'pen') || (target instanceof Element && target.closest('.hotspot'))) {
      this.clearPointer();
      return;
    }
    this.pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  protected onPointerUp(event: PointerEvent): void {
    const start = this.pointerStart;
    this.clearPointer();
    if (!start || start.id !== event.pointerId) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    this.swiped.emit(deltaX < 0 ? 'next' : 'previous');
  }

  protected clearPointer(): void {
    this.pointerStart = undefined;
  }

  protected animateArtwork(event: Event): void {
    const image = event.currentTarget;
    if (!(image instanceof HTMLImageElement)) return;
    image.classList.remove('is-entering');
    if (this.reducedMotion) return;
    void image.offsetWidth;
    image.classList.add('is-entering');
  }

  protected artworkPath(roomId: HouseRoomId): string {
    const extension = this.vectorFallbackRooms().has(roomId) ? '.svg' : '-isometric.webp';
    return `our-home/rooms/${roomId}${extension}`;
  }

  protected onArtworkError(roomId: HouseRoomId): void {
    if (!this.vectorFallbackRooms().has(roomId)) {
      this.vectorFallbackRooms.update((rooms) => new Set(rooms).add(roomId));
      return;
    }
    this.failedArtworkRooms.update((rooms) => new Set(rooms).add(roomId));
  }

  private scheduleNextArtworkPrefetch(currentRoomId: HouseRoomId): void {
    this.cancelScheduledPrefetch();
    const currentIndex = HOUSE_ROOMS.findIndex((room) => room.id === currentRoomId);
    const nextRoom = HOUSE_ROOMS[currentIndex + 1];
    const view = this.document.defaultView;
    if (!nextRoom || !view || this.prefetchedRooms.has(nextRoom.id)) return;

    const prefetch = (): void => {
      this.pendingIdleHandle = undefined;
      this.pendingTimeoutHandle = undefined;
      if (this.room.id !== currentRoomId || this.prefetchedRooms.has(nextRoom.id)) return;
      const link = this.document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = new URL(`our-home/rooms/${nextRoom.id}-isometric.webp`, this.document.baseURI).href;
      link.dataset['ourHomePrefetch'] = nextRoom.id;
      this.document.head.append(link);
      this.prefetchedRooms.add(nextRoom.id);
    };

    if (typeof view.requestIdleCallback === 'function') {
      this.pendingIdleHandle = view.requestIdleCallback(prefetch, { timeout: 1800 });
    } else {
      this.pendingTimeoutHandle = view.setTimeout(prefetch, 1200);
    }
  }

  private cancelScheduledPrefetch(): void {
    const view = this.document.defaultView;
    if (!view) return;
    if (this.pendingIdleHandle !== undefined) {
      view.cancelIdleCallback(this.pendingIdleHandle);
      this.pendingIdleHandle = undefined;
    }
    if (this.pendingTimeoutHandle !== undefined) {
      view.clearTimeout(this.pendingTimeoutHandle);
      this.pendingTimeoutHandle = undefined;
    }
  }
}
