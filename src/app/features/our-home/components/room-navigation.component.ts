import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { HouseRoom, HouseRoomId } from '../models/our-home.model';

@Component({
  selector: 'app-room-navigation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="room-nav" aria-label="Các không gian trong nhà">
      @for (room of rooms; track room.id) {
        <button type="button" [class.is-current]="room.id === currentRoomId" [attr.aria-current]="room.id === currentRoomId ? 'page' : null" [attr.tabindex]="room.id === currentRoomId ? 0 : -1" [attr.data-room-nav]="room.id" (click)="selected.emit(room.id)" (keydown)="onNavigationKeydown($event, room.id)">
          <span class="room-index">{{ room.id === 'entrance' ? '⌂' : room.title.split(' · ')[0].slice(0, 1) }}</span>
          <span>{{ room.title.split(' · ')[0] }}</span>
        </button>
      }
    </nav>
  `,
  styles: [`
    :host{display:block;min-width:0}.room-nav{display:flex;gap:.45rem;overflow-x:auto;padding:.25rem .15rem .65rem;scrollbar-width:thin;scroll-snap-type:x proximity}
    button{display:flex;flex:0 0 auto;align-items:center;gap:.45rem;min-height:48px;padding:.45rem .8rem;border:1px solid var(--border-strong);border-radius:999px;background:var(--surface);color:var(--text-secondary);font:600 .68rem var(--font-body);cursor:pointer;scroll-snap-align:start}
    button:hover,button.is-current{border-color:var(--wine);background:#f2e5dc;color:var(--wine)}button:focus-visible{outline:3px solid var(--champagne);outline-offset:2px}
    .room-index{display:grid;width:26px;height:26px;place-items:center;border-radius:50%;background:#ead9cc;color:var(--wine);font-family:var(--font-display);font-size:.9rem}
  `]
})
export class RoomNavigationComponent {
  @Input({ required: true }) rooms: readonly HouseRoom[] = [];
  @Input({ required: true }) currentRoomId!: HouseRoomId;
  @Output() readonly selected = new EventEmitter<HouseRoomId>();

  protected onNavigationKeydown(event: KeyboardEvent, roomId: HouseRoomId): void {
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!direction) return;

    const currentIndex = this.rooms.findIndex((room) => room.id === roomId);
    const nextIndex = Math.min(Math.max(currentIndex + direction, 0), this.rooms.length - 1);
    const nextRoom = this.rooms[nextIndex];
    if (!nextRoom || nextIndex === currentIndex) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    this.selected.emit(nextRoom.id);
    const buttons = (event.currentTarget as HTMLElement).closest('nav')?.querySelectorAll<HTMLButtonElement>('[data-room-nav]');
    buttons?.[nextIndex]?.focus();
  }
}
