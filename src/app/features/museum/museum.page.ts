import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MemoryService } from '../../core/services/memory.service';
import type { MemoryMedia } from '../../core/models/memory.model';
import type { MuseumDisplay, MuseumRoom } from '../../core/models/museum.model';
import { PhotoViewerComponent } from '../../shared/components/photo-viewer/photo-viewer.component';
import { MuseumSceneComponent } from './museum-scene.component';

@Component({
  standalone: true,
  imports: [DecimalPipe, RouterLink, PhotoViewerComponent, MuseumSceneComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="museum-page"
      aria-labelledby="museum-title"
      [attr.data-total-photos]="totalPhotos"
      [attr.data-room-count]="rooms.length"
    >
      <header class="museum-header">
        <div>
          <p class="eyebrow">H ♡ Q · Memory Museum</p>
          <h1 id="museum-title">Bảo tàng<br><em>ký ức.</em></h1>
          <p class="museum-intro">Một nơi để mình đi chậm qua tất cả những khung hình đã giữ chúng ta lại bên nhau.</p>
        </div>
        <a class="museum-exit" routerLink="/events">Thoát bảo tàng <span aria-hidden="true">↗</span></a>
      </header>

      <section class="museum-meta" aria-label="Thông tin bảo tàng">
        <span><strong>{{ totalPhotos }}</strong> ảnh được trưng bày</span>
        <span aria-hidden="true">·</span>
        <span><strong>{{ rooms.length }}</strong> căn phòng</span>
        <span class="museum-mode" [class.is-vr-ready]="xrAvailable()">
          <i aria-hidden="true"></i>{{ xrAvailable() ? 'WebXR sẵn sàng' : 'Chế độ trình duyệt' }}
        </span>
      </section>

      <section class="museum-stage" aria-label="Không gian bảo tàng 3D">
        <app-museum-scene
          [rooms]="rooms"
          (photoSelected)="selectDisplay($event)"
          (roomChanged)="setCurrentRoom($event)"
          (xrAvailabilityChanged)="setXRAvailability($event)"
        ></app-museum-scene>

        <div class="stage-toolbar">
          <div class="room-indicator" aria-live="polite">
            <span class="toolbar-label">Đang ở</span>
            <strong>{{ currentRoomLabel() }}</strong>
          </div>
          <button class="help-button" type="button" (click)="helpOpen.set(!helpOpen())" [attr.aria-expanded]="helpOpen()">
            {{ helpOpen() ? 'Ẩn hướng dẫn' : 'Hướng dẫn' }}
          </button>
        </div>

        @if (helpOpen()) {
          <aside class="help-overlay" aria-label="Hướng dẫn điều khiển">
            <button class="overlay-close" type="button" aria-label="Đóng hướng dẫn" (click)="helpOpen.set(false)">×</button>
            <p class="eyebrow">Cách đi dạo</p>
            <h2>Đi chậm thôi,<br><em>mình còn nhiều ảnh.</em></h2>
            <p class="help-copy desktop-help"><strong>WASD / phím mũi tên</strong> để di chuyển · click vào không gian rồi kéo chuột để nhìn quanh.</p>
            <p class="help-copy mobile-help"><strong>Joystick</strong> để di chuyển · kéo trên không gian để nhìn quanh.</p>
            <p class="help-copy vr-help"><strong>VR</strong> dùng thumbstick để đi và đưa tia điều khiển vào ảnh để mở.</p>
            <p class="help-note">Em cũng có thể mở danh mục để chọn ảnh bằng bàn phím.</p>
          </aside>
        }

        @if (selectedDisplay(); as display) {
          <aside class="selection-panel" aria-label="Thông tin ảnh đang chọn" data-selection-panel>
            <button class="overlay-close" type="button" aria-label="Đóng thông tin ảnh" (click)="selectedDisplay.set(null)">×</button>
            <p class="eyebrow">{{ displayDateLabel(display) }}</p>
            <h2>{{ display.title || 'Một khung hình của chúng mình' }}</h2>
            @if (display.caption) { <p class="selection-caption">{{ display.caption }}</p> }
            @if (display.location) { <p class="selection-location">⌖ {{ display.location }}</p> }
            <div class="selection-actions">
              <button class="primary-action" type="button" (click)="openViewer(display)">Xem ảnh lớn <span aria-hidden="true">↗</span></button>
              @if (display.memoryId) {
                <a class="secondary-action" [routerLink]="['/memory', display.memoryId]">Xem ngày này <span aria-hidden="true">→</span></a>
              }
            </div>
          </aside>
        }
      </section>

      <details class="museum-catalog">
        <summary>
          <span><span class="catalog-kicker">Lối tắt</span> Danh mục toàn bộ ảnh</span>
          <span class="summary-arrow" aria-hidden="true">↘</span>
        </summary>
        <div class="catalog-content">
          <p class="catalog-intro">Chọn một khung hình để đưa thẳng em đến căn phòng của tháng đó.</p>
          @if (!rooms.length) {
            <p class="catalog-empty">Kho ảnh đang chờ được mở.</p>
          } @else {
            @for (room of rooms; track room.id) {
              <section class="catalog-room" [attr.data-room-id]="room.id">
                <div class="catalog-room-heading">
                  <span>{{ room.isArchive ? 'Những ảnh chưa xác định ngày' : room.label }}</span>
                  <small>{{ room.displays.length }} ảnh</small>
                </div>
                <div class="catalog-grid">
                  @for (display of room.displays; track display.id) {
                    <button
                      class="catalog-item"
                      type="button"
                      [attr.data-display-id]="display.id"
                      (click)="selectFromCatalog(display)"
                    >
                      <span class="catalog-item-index">{{ $index + 1 | number: '2.0-0' }}</span>
                      <span>{{ display.title || display.caption || (display.date ? formatDay(display.date) : 'Ảnh lưu ký') }}</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  }
                </div>
              </section>
            }
          }
        </div>
      </details>

      <footer class="museum-footer">
        <a routerLink="/timeline">Xem timeline đầy đủ</a>
        <span aria-hidden="true">H ♡ Q</span>
        <p>Đi qua ký ức, rồi lại về bên nhau.</p>
      </footer>

      @if (viewerOpen()) {
        <app-photo-viewer
          [images]="viewerMedia()"
          [initialIndex]="viewerIndex()"
          (closed)="closeViewer()"
        ></app-photo-viewer>
      }
    </main>
  `,
  styles: [`
    :host { display:block; }
    .museum-page { width:min(1240px,calc(100% - 3rem)); margin:0 auto; padding:clamp(3rem,7vw,6rem) 0 4rem; color:var(--ink); }
    .museum-header { display:flex; align-items:flex-end; justify-content:space-between; gap:2rem; }
    .eyebrow { margin:0 0 .85rem; color:var(--wine); font-size:.67rem; font-weight:600; letter-spacing:.16em; text-transform:uppercase; }
    h1,h2 { margin:0; font-family:var(--font-display); font-weight:400; letter-spacing:-.065em; }
    h1 { font-size:clamp(3.6rem,9vw,8rem); line-height:.82; }
    h1 em,h2 em { color:var(--wine); font-weight:400; }
    .museum-intro { max-width:520px; margin:1.5rem 0 0; color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(1.05rem,2vw,1.3rem); line-height:1.65; }
    .museum-exit,.museum-footer a { display:inline-flex; min-height:44px; align-items:center; gap:.7rem; color:var(--wine); font-size:.7rem; font-weight:600; letter-spacing:.12em; text-decoration:none; text-transform:uppercase; }
    .museum-exit span { font-size:1.15rem; transition:transform 180ms var(--ease-out); }
    .museum-exit:hover span { transform:translate(3px,-3px); }
    .museum-meta { display:flex; align-items:center; gap:.75rem; margin-top:clamp(3rem,6vw,5rem); padding:1rem 0; border-top:1px solid var(--border); border-bottom:1px solid var(--border); color:var(--text-muted); font-size:.7rem; letter-spacing:.08em; text-transform:uppercase; }
    .museum-meta strong { color:var(--wine); font-size:.9rem; font-weight:600; }
    .museum-mode { display:inline-flex; align-items:center; gap:.45rem; margin-left:auto; }
    .museum-mode i { display:block; width:7px; height:7px; border-radius:50%; background:#b2a096; }
    .museum-mode.is-vr-ready i { background:#7caa7f; box-shadow:0 0 0 4px rgba(124,170,127,.14); }
    .museum-stage { position:relative; margin-top:1.25rem; border:1px solid rgba(127,59,75,.28); background:#1a0e12; box-shadow:0 24px 80px rgba(60,28,33,.15); }
    .stage-toolbar { position:absolute; z-index:5; top:1rem; right:1rem; left:1rem; display:flex; align-items:flex-start; justify-content:space-between; pointer-events:none; }
    .room-indicator,.help-button { border:1px solid rgba(255,253,249,.2); background:rgba(27,15,19,.68); color:#fffdf9; backdrop-filter:blur(10px); }
    .room-indicator { display:grid; gap:.3rem; min-width:170px; padding:.7rem .9rem; }
    .toolbar-label { color:rgba(255,253,249,.56); font-size:.6rem; letter-spacing:.14em; text-transform:uppercase; }
    .room-indicator strong { font-family:var(--font-display); font-size:1.05rem; font-weight:400; }
    .help-button { min-width:44px; min-height:44px; padding:.7rem .95rem; cursor:pointer; font-size:.66rem; letter-spacing:.08em; text-transform:uppercase; pointer-events:auto; }
    .help-button:hover,.primary-action:hover { background:#955263; }
    .help-overlay,.selection-panel { position:absolute; z-index:7; width:min(360px,calc(100% - 2rem)); padding:1.5rem; border:1px solid rgba(255,253,249,.24); background:rgba(35,18,24,.94); color:#fffdf9; box-shadow:0 20px 70px rgba(0,0,0,.3); backdrop-filter:blur(18px); }
    .help-overlay { top:5.5rem; left:1rem; }
    .selection-panel { right:1rem; bottom:1rem; }
    .overlay-close { position:absolute; top:.7rem; right:.7rem; display:grid; width:44px; height:44px; place-items:center; border:0; background:transparent; color:#fffdf9; cursor:pointer; font-size:1.55rem; }
    .help-overlay h2,.selection-panel h2 { padding-right:2rem; font-size:clamp(2rem,5vw,3.2rem); line-height:.91; }
    .help-copy { margin:1.3rem 0 0; color:rgba(255,253,249,.78); font-size:.85rem; line-height:1.6; }
    .help-copy strong { color:#f1c992; font-weight:600; }
    .help-note { margin:1rem 0 0; color:rgba(255,253,249,.5); font-size:.72rem; line-height:1.5; }
    .mobile-help { display:none; }
    .vr-help { color:rgba(255,253,249,.62); }
    .selection-panel .eyebrow { color:#e1b57b; padding-right:2rem; }
    .selection-caption { margin:1rem 0 0; color:rgba(255,253,249,.78); font-family:var(--font-display); font-size:1.05rem; line-height:1.55; }
    .selection-location { margin:.75rem 0 0; color:rgba(255,253,249,.54); font-size:.75rem; letter-spacing:.06em; }
    .selection-actions { display:flex; flex-wrap:wrap; gap:.65rem; margin-top:1.35rem; }
    .primary-action,.secondary-action { display:inline-flex; min-height:44px; align-items:center; justify-content:center; gap:.45rem; padding:.7rem .9rem; border:1px solid rgba(255,253,249,.23); font-size:.67rem; letter-spacing:.08em; text-decoration:none; text-transform:uppercase; }
    .primary-action { background:#7f3b4b; color:#fffdf9; cursor:pointer; }
    .secondary-action { color:#f1c992; }
    .secondary-action:hover { background:rgba(255,253,249,.1); }
    .museum-catalog { margin-top:1.25rem; border-top:1px solid var(--border-strong); border-bottom:1px solid var(--border-strong); }
    .museum-catalog summary { display:flex; align-items:center; justify-content:space-between; min-height:72px; color:var(--ink); cursor:pointer; font-family:var(--font-display); font-size:clamp(1.4rem,3vw,2.4rem); list-style:none; }
    .museum-catalog summary::-webkit-details-marker { display:none; }
    .catalog-kicker { display:block; margin-bottom:.25rem; color:var(--wine); font-family:var(--font-body); font-size:.62rem; font-weight:600; letter-spacing:.13em; text-transform:uppercase; }
    .summary-arrow { color:var(--wine); font-family:var(--font-body); font-size:1.5rem; }
    .catalog-content { padding:0 0 2rem; }
    .catalog-intro { margin:0 0 1.5rem; color:var(--text-secondary); font-family:var(--font-display); font-size:1.05rem; }
    .catalog-room + .catalog-room { margin-top:2rem; }
    .catalog-room-heading { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:.6rem; padding-bottom:.6rem; border-bottom:1px solid var(--border); color:var(--wine); font-size:.72rem; font-weight:600; letter-spacing:.13em; text-transform:uppercase; }
    .catalog-room-heading small { color:var(--text-muted); font-size:.62rem; font-weight:400; }
    .catalog-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.5rem; }
    .catalog-item { display:grid; grid-template-columns:2.3rem minmax(0,1fr) auto; align-items:center; gap:.55rem; min-height:48px; padding:.6rem .7rem; border:1px solid var(--border); background:var(--surface); color:var(--ink); cursor:pointer; text-align:left; transition:background 180ms var(--ease-out),border-color 180ms var(--ease-out),transform 180ms var(--ease-out); }
    .catalog-item:hover,.catalog-item:focus-visible { border-color:var(--wine); background:#fff8ee; transform:translateY(-2px); }
    .catalog-item-index { color:var(--wine); font-size:.65rem; letter-spacing:.08em; }
    .catalog-item span:nth-child(2) { overflow:hidden; font-family:var(--font-display); font-size:1rem; text-overflow:ellipsis; white-space:nowrap; }
    .catalog-item span:last-child { color:var(--wine); font-size:1.1rem; }
    .catalog-empty { margin:0; color:var(--text-muted); }
    .museum-footer { display:grid; justify-items:center; gap:.5rem; margin-top:4rem; padding-top:1.5rem; border-top:1px solid var(--border); text-align:center; }
    .museum-footer a { min-height:44px; }
    .museum-footer span { color:var(--wine); font-size:.7rem; font-weight:600; letter-spacing:.14em; }
    .museum-footer p { margin:0; color:var(--text-muted); font-family:var(--font-display); font-size:1.05rem; }
    @media (max-width:680px) {
      .museum-page { width:min(calc(100% - 2rem),560px); padding-top:2.7rem; }
      .museum-header { display:block; }
      .museum-exit { margin-top:1.5rem; }
      .museum-meta { flex-wrap:wrap; gap:.5rem; font-size:.61rem; }
      .museum-mode { width:100%; margin-left:0; }
      .stage-toolbar { top:.75rem; right:.75rem; left:.75rem; }
      .room-indicator { min-width:130px; padding:.6rem .7rem; }
      .help-button { padding:.6rem .7rem; }
      .help-overlay { top:5.2rem; left:.75rem; }
      .selection-panel { right:.75rem; bottom:.75rem; }
      .desktop-help { display:none; }
      .mobile-help { display:block; }
      .catalog-grid { grid-template-columns:1fr; }
      .museum-catalog summary { min-height:64px; }
    }
    @media (prefers-reduced-motion: reduce) { .museum-exit span,.catalog-item { transition:none; } }
  `]
})
export class MuseumPage {
  private readonly memoryService = inject(MemoryService);

  @ViewChild(MuseumSceneComponent) private readonly scene?: MuseumSceneComponent;

  protected readonly rooms: readonly MuseumRoom[] = this.memoryService.getMuseumRooms();
  protected readonly totalPhotos = this.memoryService.getAllImageMedia().length;
  protected readonly selectedDisplay = signal<MuseumDisplay | null>(null);
  protected readonly currentRoomId = signal<string | null>(this.rooms[0]?.id ?? null);
  protected readonly helpOpen = signal(true);
  protected readonly xrAvailable = signal(false);
  protected readonly viewerOpen = signal(false);
  protected readonly viewerMedia = signal<readonly MemoryMedia[]>([]);
  protected readonly viewerIndex = signal(0);

  protected currentRoomLabel(): string {
    const room = this.rooms.find((item) => item.id === this.currentRoomId());
    return room?.isArchive ? 'Những ảnh chưa xác định ngày' : room?.label ?? 'Sảnh đón';
  }

  protected setCurrentRoom(roomId: string): void {
    this.currentRoomId.set(roomId);
  }

  protected setXRAvailability(available: boolean): void {
    this.xrAvailable.set(available);
  }

  protected selectDisplay(display: MuseumDisplay): void {
    this.selectedDisplay.set(display);
  }

  protected selectFromCatalog(display: MuseumDisplay): void {
    this.selectedDisplay.set(display);
    this.scene?.focusDisplay(display.id);
  }

  protected displayDateLabel(display: MuseumDisplay): string {
    if (display.date) {
      return this.memoryService.formatDate(display.date);
    }
    const room = this.rooms.find((item) => item.displays.some((itemDisplay) => itemDisplay.id === display.id));
    return room?.label ?? 'Kho lưu trữ · chưa xác định ngày';
  }

  protected formatDay(date: string): string {
    return this.memoryService.formatDayMonth(date);
  }

  protected openViewer(display: MuseumDisplay): void {
    if (display.memoryId) {
      const memory = this.memoryService.getMemoryById(display.memoryId);
      const images = memory?.images ?? [display.media];
      const index = Math.max(0, images.findIndex((media) => media.id === display.media.id));
      this.viewerMedia.set(images);
      this.viewerIndex.set(index);
    } else {
      this.viewerMedia.set([display.media]);
      this.viewerIndex.set(0);
    }
    this.viewerOpen.set(true);
  }

  protected closeViewer(): void {
    this.viewerOpen.set(false);
  }
}
