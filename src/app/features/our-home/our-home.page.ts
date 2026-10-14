import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MemoryMedia } from '../../core/models/memory.model';
import { MemoryService } from '../../core/services/memory.service';
import { PhotoViewerComponent } from '../../shared/components/photo-viewer/photo-viewer.component';
import { HOUSE_COPY } from './content/house-copy.content';
import { HOUSE_LETTERS } from './content/letters.content';
import { HOUSE_ROOMS } from './content/room-map.content';
import { selectOurHomePhotos } from './content/photo-selection';
import { FinalGiftComponent } from './components/final-gift.component';
import { HouseDialogComponent } from './components/house-dialog.component';
import { HouseMusicPlayerComponent } from './components/house-music-player.component';
import { HouseSceneComponent } from './components/house-scene.component';
import { RoomNavigationComponent } from './components/room-navigation.component';
import { TwoClocksComponent } from './components/two-clocks.component';
import { HouseTimeService } from './services/house-time.service';
import { OurHomeProgressService } from './services/our-home-progress.service';
import type { HouseDialogState, HouseHotspot, HouseRoomId } from './models/our-home.model';

@Component({
  standalone: true,
  imports: [RouterLink, HouseSceneComponent, RoomNavigationComponent, HouseDialogComponent, HouseMusicPlayerComponent, TwoClocksComponent, FinalGiftComponent, PhotoViewerComponent],
  providers: [HouseTimeService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="our-home-page" [class.is-reduced-motion]="reducedMotion()" aria-labelledby="our-home-title">
      <header class="page-heading">
        <p class="eyebrow">H ♡ Q · Our Little Home</p>
        <h1 id="our-home-title">Ngôi nhà nhỏ<br><em>của chúng mình.</em></h1>
        <p class="home-intro">{{ room().subtitle }}</p>
      </header>

      @if (room().id === 'study') {
        <p class="study-date" data-study-date><span>Hôm nay ở Nhật</span>{{ time.getJapanDate() }} · {{ time.getJapanClock() }}</p>
      }

      <div class="scene-shell">
        <app-house-scene [room]="room()" [mood]="time.getMood()" [reducedMotion]="reducedMotion()" [lampOn]="lampOn()" [introStage]="introStage()" (activated)="onHotspot($event)" (swiped)="onRoomSwipe($event)" />
        @if (room().id === 'entrance') {
          <section class="welcome-card" aria-labelledby="welcome-title">
            <div class="welcome-copy">
              <p class="welcome-eyebrow">{{ introStage() === 'story' ? 'Vợ iu về nhà rồi! 🏡❤️' : 'Một căn nhà nhỏ, luôn để đèn chờ em.' }}</p>
              <h2 id="welcome-title">{{ introStage() === 'story' ? 'Em cứ ghé vào đây mỗi khi muốn nghỉ một chút nhé.' : 'Có một nơi đang chờ em về.' }}</h2>
              @if (introStage() === 'story') {
                <p>Chồng chưa thể ở cạnh em mỗi tối, nên chồng làm cho hai đứa mình một ngôi nhà nhỏ. Khi nào mệt, em cứ về đây nhé.</p>
                <button class="welcome-primary" type="button" (click)="enterHome()">Vào nhà của chúng mình</button>
              } @else if (introStage() === 'welcome') {
                <p>Chạm vào những món đồ trong nhà để xem lời nhắn, ảnh kỷ niệm và những góc nhỏ dành cho em.</p>
                <div class="welcome-actions">
                  <button class="welcome-primary" type="button" (click)="startIntro()">Mở cánh cửa của chúng mình</button>
                  <button class="welcome-secondary" type="button" (click)="skipIntro()">Bỏ qua lời chào</button>
                </div>
              } @else {
                <p>Ngôi nhà luôn mở. Em có thể tự chọn một căn phòng hoặc ghé thẳng vào phòng khách.</p>
                <button class="welcome-primary" type="button" (click)="enterHome()">Vào nhà của chúng mình</button>
              }
            </div>
            <div class="welcome-mark" aria-hidden="true">⌂<span>H ♡ Q</span></div>
          </section>
        }
      </div>
      <p class="scene-title" aria-live="polite">{{ room().title }}</p>
      <app-room-navigation [rooms]="rooms" [currentRoomId]="room().id" (selected)="goToRoom($event)" />

      <section class="house-controls" aria-label="Điều khiển căn nhà">
        <div class="utility-actions">
          <button class="gift-button" [class.is-ready]="progress().collectedStamps.length >= 4" type="button" (click)="openGift()"><span aria-hidden="true">🎁</span> Mở hộp quà</button>
          <button class="motion-button" type="button" [attr.aria-pressed]="reducedMotion()" (click)="toggleMotion()">{{ reducedMotion() ? 'Bật chuyển động tinh tế' : 'Tắt chuyển động' }}</button>
          <button class="reset-button" type="button" (click)="askForReset()">Xem từ đầu</button>
        </div>
        <div class="progress-summary" aria-label="Tiến trình căn nhà">
          <span>{{ progress().exploredRooms.length }}/6 góc đã ghé</span>
          <span>{{ progress().collectedStamps.length }}/5 dấu ấn</span>
          <span>{{ progress().openedLetters.length }}/5 lá thư đã mở</span>
        </div>
      </section>

      <section class="stamp-strip" aria-label="Những dấu ấn đã nhặt">
        @for (stamp of stampDisplay; track stamp.id) {
          <span class="stamp" [class.is-collected]="progress().collectedStamps.includes(stamp.id)" [attr.aria-label]="progress().collectedStamps.includes(stamp.id) ? stamp.label + ': đã nhặt' : stamp.label + ': chưa nhặt'">
            <span aria-hidden="true">{{ progress().collectedStamps.includes(stamp.id) ? '✦' : '·' }}</span> {{ stamp.label }}
          </span>
        }
      </section>

      <footer class="home-footer">
        <p>Em có thể đi tới bất kỳ căn phòng nào và mở món quà bất cứ lúc nào.</p>
        <a routerLink="/events">Về các lựa chọn</a>
      </footer>

      @if (dialog(); as activeDialog) {
        <app-house-dialog [title]="activeDialog.title" (dismissed)="closeDialog()">
          @switch (activeDialog.kind) {
            @case ('copy') {
              <div class="copy-content" [attr.data-copy-id]="activeDialog.copyId">
                @if (activeDialog.copyId === 'tea-comfort') {
                  <div class="reveal-art reveal-art--tea" aria-hidden="true">
                    <span class="tea-steam tea-steam--left">~</span><span class="tea-steam tea-steam--right">~</span>
                    <span class="tea-cup">☕</span>
                  </div>
                } @else if (activeDialog.copyId === 'bedtime-hug') {
                  <div class="reveal-art reveal-art--pillow" aria-hidden="true">
                    <span class="pillow-cushion">♡</span><span class="pillow-heart">♥</span>
                  </div>
                }
                <p>{{ copyFor(activeDialog.copyId) }}</p>
              </div>
            }
            @case ('gallery') {
              <div class="gallery-content">
                <p class="dialog-lead">Một vài khung ảnh lấy từ bộ sưu tập kỷ niệm của chúng mình.</p>
                @if (photos.length) {
                  <div class="memory-grid">
                    @for (photo of photos; track photo.id; let index = $index) {
                      <button class="memory-tile" type="button" [attr.data-photo-id]="photo.id" [attr.aria-label]="'Mở ảnh kỷ niệm ' + (index + 1)" (click)="openPhoto(index)">
                        @if (failedPhotoIds().has(photo.id)) {
                          <span class="photo-fallback" aria-hidden="true">♡<small>Khung ảnh</small></span>
                        } @else {
                          <img [src]="photo.thumbnailSrc || photo.src" [attr.alt]="photo.alt || 'Ảnh kỷ niệm'" loading="lazy" (error)="markPhotoFailed(photo.id)">
                        }
                      </button>
                    }
                  </div>
                  <p class="photo-note">{{ photos.length }} ảnh kỷ niệm đã được chọn riêng cho căn nhà này.</p>
                } @else {
                  <div class="empty-gallery"><span aria-hidden="true">♡</span><p>Khung ảnh đang chờ những tấm ảnh được chọn cho căn nhà.</p></div>
                }
              </div>
            }
            @case ('letters') {
              <div class="letter-list">
                <p class="dialog-lead">Em chọn lá thư nào cũng được. Mỗi lá đều có thể mở lại bất cứ lúc nào.</p>
                @for (letter of letters; track letter.id) {
                  <button type="button" class="letter-choice" [attr.data-letter-id]="letter.id" (click)="openLetter(letter.id)">
                    <span aria-hidden="true">{{ letter.icon }}</span><strong>{{ letter.label }}</strong>
                    <small>{{ progress().openedLetters.includes(letter.id) ? 'Đã mở · có thể đọc lại' : 'Chưa mở' }}</small>
                  </button>
                }
              </div>
            }
            @case ('letter') {
              <div class="letter-content" data-letter-content>
                @if (letterFor(activeDialog.letterId); as letter) { <p>{{ letter.body }}</p> }
                <button type="button" class="dialog-secondary" (click)="openLetters()">Chọn lá thư khác</button>
              </div>
            }
            @case ('music') { <app-house-music-player [audioEnabled]="progress().audioEnabled" (audioEnabledChange)="progressService.setAudioEnabled($event)" /> }
            @case ('clocks') { <app-two-clocks /> }
            @case ('gift') {
              <app-final-gift [stampCount]="progress().collectedStamps.length" [reducedMotion]="reducedMotion()" (replay)="replayFromBeginning()" (returnHome)="returnToLiving()" (hugReceived)="progressService.markFinaleSeen()" />
            }
            @case ('reset') {
              <div class="reset-confirmation">
                <p>Tiến trình chỉ lưu trên trình duyệt này. Em muốn xóa các dấu ấn và thư đã mở để bắt đầu lại không?</p>
                <div><button class="danger-action" type="button" (click)="resetProgress()">Xóa tiến trình Our Home</button><button class="dialog-secondary" type="button" (click)="closeDialog()">Giữ lại</button></div>
              </div>
            }
          }
        </app-house-dialog>
      }

      @if (photoViewerOpen()) {
        <app-photo-viewer [images]="photos" [initialIndex]="viewerIndex()" (closed)="closePhotoViewer()" />
      }
    </main>
  `,
  styleUrl: './our-home.page.scss'
})
export class OurHomePage implements OnDestroy {
  protected readonly progressService = inject(OurHomeProgressService);
  protected readonly progress = this.progressService.progress;
  protected readonly time = inject(HouseTimeService);
  private readonly memoryService = inject(MemoryService);
  private readonly document = inject(DOCUMENT);
  protected readonly rooms = HOUSE_ROOMS;
  protected readonly letters = HOUSE_LETTERS;
  protected readonly roomId = signal<HouseRoomId>('entrance');
  protected readonly room = computed(() => this.rooms.find((item) => item.id === this.roomId()) ?? this.rooms[0]);
  protected readonly dialog = signal<HouseDialogState | null>(null);
  protected readonly introStage = signal<'welcome' | 'story' | 'done'>(this.progress().introSeen ? 'done' : 'welcome');
  protected readonly lampOn = signal(true);
  protected readonly systemReducedMotion = signal(false);
  protected readonly reducedMotion = computed(() => this.progress().reducedMotionOverride ?? this.systemReducedMotion());
  protected readonly photos = selectOurHomePhotos(this.memoryService.getAllImageMedia());
  protected readonly failedPhotoIds = signal<ReadonlySet<string>>(new Set());
  protected readonly photoViewerOpen = signal(false);
  protected readonly viewerIndex = signal(0);
  protected readonly stampDisplay = [
    { id: 'memory', label: 'Ký ức' },
    { id: 'care', label: 'Quan tâm' },
    { id: 'courage', label: 'Cố gắng' },
    { id: 'letters', label: 'Lá thư' },
    { id: 'moon', label: 'Ánh trăng' }
  ] as const;
  private motionQuery?: MediaQueryList;

  constructor() {
    const view = this.document.defaultView;
    if (!view?.matchMedia) return;
    this.motionQuery = view.matchMedia('(prefers-reduced-motion: reduce)');
    this.systemReducedMotion.set(this.motionQuery.matches);
    this.motionQuery.addEventListener('change', this.onMotionPreferenceChange);
  }

  ngOnDestroy(): void {
    this.motionQuery?.removeEventListener('change', this.onMotionPreferenceChange);
  }

  protected startIntro(): void {
    this.introStage.set('story');
    this.progressService.markIntroSeen();
  }

  protected skipIntro(): void {
    this.progressService.markIntroSeen();
    this.introStage.set('done');
    this.goToRoom('living');
  }

  protected enterHome(): void {
    this.progressService.markIntroSeen();
    this.introStage.set('done');
    this.goToRoom('living');
  }

  protected goToRoom(roomId: HouseRoomId): void {
    if (!this.rooms.some((room) => room.id === roomId)) return;
    this.roomId.set(roomId);
    this.progressService.exploreRoom(roomId);
    if (roomId !== 'entrance' && !this.progress().introSeen) this.progressService.markIntroSeen();
    if (roomId !== 'entrance') this.introStage.set('done');
  }

  protected onRoomSwipe(direction: 'previous' | 'next'): void {
    const index = this.rooms.findIndex((item) => item.id === this.room().id);
    const nextIndex = index + (direction === 'next' ? 1 : -1);
    const nextRoom = this.rooms[nextIndex];
    if (nextRoom) this.goToRoom(nextRoom.id);
  }

  protected onHotspot(hotspot: HouseHotspot): void {
    switch (hotspot.action) {
      case 'navigate':
        this.progressService.markIntroSeen();
        this.goToRoom(hotspot.payloadId as HouseRoomId);
        return;
      case 'dialog':
        if (hotspot.awardsStamp) this.progressService.collectStamp(hotspot.awardsStamp);
        this.openCopyDialog(hotspot.visualLabel, hotspot.payloadId ?? 'home-welcome');
        return;
      case 'photo-gallery':
        this.dialog.set({ kind: 'gallery', title: 'Khung ảnh của chúng mình' });
        return;
      case 'letter-box':
        this.openLetters();
        return;
      case 'audio':
        this.dialog.set({ kind: 'music', title: 'Máy phát nhạc' });
        return;
      case 'toggle-light':
        this.lampOn.update((on) => !on);
        this.openCopyDialog(hotspot.visualLabel, hotspot.payloadId ?? 'study-lamp');
        return;
      case 'reveal':
        if (hotspot.awardsStamp) this.progressService.collectStamp(hotspot.awardsStamp);
        this.openCopyDialog(hotspot.visualLabel, hotspot.payloadId ?? 'home-welcome');
        return;
      case 'clocks':
        if (hotspot.awardsStamp) this.progressService.collectStamp(hotspot.awardsStamp);
        this.dialog.set({ kind: 'clocks', title: 'Hai chiếc đồng hồ' });
        return;
    }
  }

  private openCopyDialog(title: string, copyId: string): void {
    this.dialog.set({ kind: 'copy', title, copyId });
  }

  protected openGift(): void {
    this.progressService.markFinaleSeen();
    this.dialog.set({ kind: 'gift', title: 'Một món quà nhỏ dành cho em' });
  }

  protected openLetters(): void {
    this.dialog.set({ kind: 'letters', title: 'Mở khi em…' });
  }

  protected openLetter(letterId: string): void {
    const letter = this.letterFor(letterId);
    if (!letter) return;
    this.progressService.openLetter(letterId);
    this.dialog.set({ kind: 'letter', title: letter.label, letterId: letter.id });
  }

  protected letterFor(letterId: string) {
    return this.letters.find((letter) => letter.id === letterId);
  }

  protected copyFor(copyId: string): string {
    return HOUSE_COPY[copyId] ?? 'Một góc nhỏ đang chờ lời nhắn của chúng mình.';
  }

  protected openPhoto(index: number): void {
    if (!this.photos[index]) return;
    this.progressService.collectStamp('memory');
    this.viewerIndex.set(index);
    this.photoViewerOpen.set(true);
  }

  protected closePhotoViewer(): void {
    this.photoViewerOpen.set(false);
  }

  protected markPhotoFailed(photoId: string): void {
    this.failedPhotoIds.update((failed) => new Set([...failed, photoId]));
  }

  protected closeDialog(): void {
    this.dialog.set(null);
  }

  protected toggleMotion(): void {
    this.progressService.setReducedMotionOverride(!this.reducedMotion());
  }

  protected askForReset(): void {
    this.dialog.set({ kind: 'reset', title: 'Bắt đầu lại từ đầu?' });
  }

  protected resetProgress(): void {
    this.progressService.reset();
    this.introStage.set('welcome');
    this.roomId.set('entrance');
    this.closeDialog();
  }

  protected replayFromBeginning(): void {
    this.roomId.set('entrance');
    this.introStage.set('welcome');
    this.progressService.exploreRoom('entrance');
    this.closeDialog();
  }

  protected returnToLiving(): void {
    this.closeDialog();
    this.goToRoom('living');
  }

  private readonly onMotionPreferenceChange = (event: MediaQueryListEvent): void => {
    this.systemReducedMotion.set(event.matches);
  };
}
