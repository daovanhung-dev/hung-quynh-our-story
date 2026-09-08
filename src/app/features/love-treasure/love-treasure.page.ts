import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Memory, MemoryMedia } from '../../core/models/memory.model';
import { MemoryService } from '../../core/services/memory.service';
import { MediaFrameComponent } from '../../shared/components/media-frame/media-frame.component';

interface TreasureMemoryContext {
  date?: string;
  title?: string;
  caption?: string;
  location?: string;
}

interface TreasurePhotoFrame {
  key: number;
  media: MemoryMedia;
  context: TreasureMemoryContext;
  slot: number;
  left: number;
  top: number;
  rotation: number;
  scale: number;
  brightness: number;
  depth: number;
  delayMs: number;
  durationMs: number;
}

interface PhotoPlacement {
  left: number;
  top: number;
}

const TREASURE_LINES = [
  'Anh đã cất những ngày bình thường này thành một kho báu.',
  'Mỗi bức ảnh là một vì sao nhỏ trong câu chuyện H ♡ Q.',
  'Có những kỷ niệm không cần nói thành lời — chỉ cần em cười là anh nhớ.',
  'Điều anh thích nhất không phải nơi mình đến, mà là người luôn đi cùng anh.',
  'Mình cứ chụp thêm nhé, vì phía trước còn rất nhiều ngày đẹp.',
  'Kho báu này còn mở mãi, miễn là chúng mình vẫn chọn nhau mỗi ngày.'
] as const;

const DESKTOP_PHOTO_PLACEMENTS: readonly PhotoPlacement[] = [
  { left: 8, top: 50 },
  { left: 21, top: 50 },
  { left: 8, top: 70 },
  { left: 21, top: 70 },
  { left: 93, top: 10 },
  { left: 93, top: 90 },
  { left: 34, top: 90 },
  { left: 60, top: 90 },
  { left: 8, top: 30 },
  { left: 21, top: 30 },
  { left: 93, top: 30 },
  { left: 34, top: 72 },
  { left: 60, top: 72 },
  { left: 8, top: 90 },
  { left: 21, top: 90 },
  { left: 86, top: 10 },
  { left: 86, top: 90 },
  { left: 34, top: 50 }
] as const;

const MOBILE_PHOTO_PLACEMENTS: readonly PhotoPlacement[] = [
  { left: 20, top: 30 },
  { left: 80, top: 30 },
  { left: 20, top: 39 },
  { left: 80, top: 39 },
  { left: 20, top: 48 },
  { left: 80, top: 48 },
  { left: 20, top: 57 },
  { left: 80, top: 57 },
  { left: 20, top: 66 },
  { left: 80, top: 66 }
] as const;

const TABLET_PHOTO_PLACEMENTS: readonly PhotoPlacement[] = [
  { left: 7, top: 44 },
  { left: 24, top: 44 },
  { left: 76, top: 44 },
  { left: 93, top: 44 },
  { left: 7, top: 57 },
  { left: 24, top: 57 },
  { left: 76, top: 57 },
  { left: 93, top: 57 },
  { left: 7, top: 70 },
  { left: 24, top: 70 },
  { left: 76, top: 70 },
  { left: 93, top: 70 }
] as const;

interface LoveTrack {
  id: string;
  title: string;
  src: string;
  duration: number;
}

const LOVE_TRACKS: readonly LoveTrack[] = [
  { id: 'cafe', title: 'Cà phê đắng như ly cafe', src: `mp3/${encodeURIComponent('Cà phê đắng như ly cafe.mp3')}`, duration: 0 },
  { id: 'mascara', title: 'Mascara', src: `mp3/${encodeURIComponent('Mascara.mp3')}`, duration: 0 },
  { id: 'mo', title: 'Mơ', src: `mp3/${encodeURIComponent('Mơ.mp3')}`, duration: 0 },
  { id: 'thang-dien', title: 'Thằng Điên', src: `mp3/${encodeURIComponent('Thằng Điên.mp3')}`, duration: 0 },
  { id: 'vi-anh-dau-co-biet', title: 'Vì anh đâu có biết', src: `mp3/${encodeURIComponent('Vì anh đâu có biết.mp3')}`, duration: 0 }
] as const;

@Component({
  standalone: true,
  imports: [MediaFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="treasure-page" [class.is-paused]="paused()" [class.is-reduced-motion]="reducedMotion" [class.is-playing]="isPlaying()" [class.is-autoplay-blocked]="autoplayBlocked()">
      <section #stage class="treasure-stage" aria-labelledby="treasure-title">
        <div class="treasure-vignette" aria-hidden="true"></div>

        <audio
          #audio
          class="love-audio-source"
          preload="metadata"
          [src]="activeTrack().src"
          aria-hidden="true"
          (loadedmetadata)="onLoadedMetadata($event)"
          (canplay)="onCanPlay($event)"
          (timeupdate)="onTimeUpdate($event)"
          (play)="onPlay()"
          (pause)="onPause()"
          (ended)="onEnded()"
          (error)="onAudioError()"
        ></audio>

        <div class="treasure-layout">
          <section class="treasure-artboard" aria-label="Không gian kỷ niệm">
            <header class="treasure-heading">
              <p class="treasure-kicker">H ♡ Q <span>·</span> memory constellation</p>
              <h1 id="treasure-title">Chúc mừng vợ yêu <em>khám phá được thêm một kho báu</em></h1>
              <p class="treasure-subtitle">Mỗi tấm ảnh là một vì sao nhỏ trong bầu trời của chúng mình.</p>
              <p class="treasure-guidance">Chạm vào một kỷ niệm để giữ lại lâu hơn.</p>
            </header>

            <div class="treasure-visual-zone">
              <svg class="galaxy-orbits" viewBox="0 0 100 100" aria-hidden="true">
                <ellipse class="orbit orbit--one" cx="50" cy="53" rx="35" ry="24"></ellipse>
                <ellipse class="orbit orbit--two" cx="50" cy="53" rx="43" ry="18" transform="rotate(28 50 53)"></ellipse>
                <ellipse class="orbit orbit--three" cx="50" cy="53" rx="30" ry="39" transform="rotate(-32 50 53)"></ellipse>
                <path class="constellation-line" d="M18 37 L31 22 L50 17 L70 23 L84 40"></path>
                <path class="constellation-line constellation-line--lower" d="M84 40 L78 70 L57 79 L29 72 L16 38"></path>
                <circle class="constellation-star" cx="31" cy="22" r=".7"></circle>
                <circle class="constellation-star" cx="70" cy="23" r=".7"></circle>
                <circle class="constellation-star" cx="57" cy="79" r=".7"></circle>
              </svg>

              <span class="star star--one" aria-hidden="true">✦</span>
              <span class="star star--three" aria-hidden="true">✧</span>
              <span class="star star--five" aria-hidden="true">✦</span>
              <span class="star star--six" aria-hidden="true">·</span>

              <div class="galaxy-core" aria-hidden="true">
                <span class="core-halo"></span>
                <span class="core-seal">H<br><i>♡</i> Q</span>
              </div>

              <div
                class="treasure-stream"
                [class.has-selection]="selectedFrame() !== undefined"
                aria-label="Dòng ảnh kỷ niệm"
                [attr.data-total-photos]="totalPhotos"
                [attr.data-active-limit]="activeLimit"
              >
                @for (frame of activePhotos(); track frame.key) {
                  <button
                    class="treasure-photo"
                    [class.is-selected]="selectedKey() === frame.key"
                    type="button"
                    [attr.data-photo-id]="frame.media.id"
                    [attr.aria-label]="photoAriaLabel(frame)"
                    [attr.aria-pressed]="selectedKey() === frame.key"
                    [style.--photo-left]="frame.left + '%'"
                    [style.--photo-top]="frame.top + '%'"
                    [style.--photo-rotation]="frame.rotation + 'deg'"
                    [style.--photo-scale]="frame.scale"
                    [style.--photo-brightness]="frame.brightness"
                    [style.--photo-delay]="frame.delayMs + 'ms'"
                    [style.--photo-duration]="frame.durationMs + 'ms'"
                    [style.z-index]="frame.depth"
                    (click)="selectPhoto(frame)"
                  >
                    <span class="photo-aura" aria-hidden="true"></span>
                    <span class="photo-paper">
                      <app-media-frame [media]="frame.media" alt="" [priority]="frame.key <= 2" sizes="(max-width: 680px) 24vw, 13vw" />
                    </span>
                  </button>
                } @empty {
                  <p class="treasure-empty">Kho báu đang chờ những kỷ niệm đầu tiên.</p>
                }
              </div>
            </div>

            <div class="treasure-footer">
              <div class="treasure-note" aria-live="polite" aria-atomic="true">
                @if (selectedFrame(); as selected) {
                  <span>Đang giữ lại một vì sao của chúng mình.</span>
                } @else {
                  <span>{{ currentLine() }}</span>
                }
              </div>

              @if (selectedFrame(); as selected) {
                <aside class="treasure-memory-panel" aria-label="Thông tin kỷ niệm đang chọn">
                  <button class="panel-close" type="button" aria-label="Bỏ giữ ảnh" (click)="clearSelection()">×</button>
                  <p class="panel-date">{{ selected.context.date ? formatDate(selected.context.date) : 'một ngày anh muốn nhớ' }}</p>
                  <h2>{{ selected.context.title || 'Một khoảnh khắc anh vẫn muốn giữ bên em' }}</h2>
                  @if (selected.context.caption) { <p class="panel-caption">{{ selected.context.caption }}</p> }
                  @if (selected.context.location) { <p class="panel-location">⌖ {{ selected.context.location }}</p> }
                </aside>
              }

              <div class="treasure-bottom">
                @if (totalPhotos > 0) {
                  <p class="stream-counter" aria-hidden="true">
                    <span>{{ sequencePosition() }}</span><i></i><small>{{ totalPhotos }} kỷ niệm · vòng lặp vô tận</small>
                  </p>
                }
              </div>
            </div>
          </section>

          <aside class="music-column" aria-label="Khu vực phát nhạc">
            <div class="record-stage" aria-hidden="true">
              <div class="record-halo"></div>
              <div class="vinyl-record">
                <span class="vinyl-disc-face">
                  <span class="vinyl-grooves"></span>
                  <span class="vinyl-sheen"></span>
                  <span class="vinyl-label">H<br><i>♡</i> Q</span>
                  <span class="vinyl-hole"></span>
                </span>
              </div>
              <div class="record-arm"><span class="record-needle"></span></div>
            </div>

            <aside class="music-panel" aria-label="Trình phát nhạc">
            <header class="music-panel-header">
              <p>H ♡ Q <span>·</span> love archive</p>
              <h2>Nhạc cho kho báu này</h2>
            </header>

            <div class="now-playing" aria-live="polite" aria-atomic="true">
              <p>Đang phát cho riêng em</p>
              <strong>{{ activeTrack().title }}</strong>
              <span>{{ isPlaying() ? 'Đĩa đang quay' : autoplayBlocked() ? 'Chạm để mở nhạc' : 'Tạm dừng' }}</span>
            </div>

            @if (autoplayBlocked()) {
              <p class="autoplay-hint">Chạm vào nút phát để mở nhạc cho kho báu này.</p>
              <button class="autoplay-fallback" type="button" (click)="playAudio()">Bật nhạc</button>
            }
            @if (audioError()) {
              <p class="audio-error" role="alert">Bài này chưa thể phát. Em thử bài khác nhé.</p>
            }

            <div class="music-transport" aria-label="Điều khiển bài hát">
              <button class="music-icon-button" type="button" aria-label="Bài trước" (click)="previousTrack()">↶</button>
              <button
                class="music-play-button"
                type="button"
                [attr.aria-label]="isPlaying() ? 'Tạm dừng nhạc' : 'Phát nhạc'"
                [attr.aria-pressed]="isPlaying()"
                (click)="togglePlayback()"
              >
                <span aria-hidden="true">{{ isPlaying() ? 'Ⅱ' : '▶' }}</span>
              </button>
              <button class="music-icon-button" type="button" aria-label="Bài tiếp theo" (click)="nextTrack()">↷</button>
            </div>

            <div class="music-progress">
              <span>{{ formatTime(currentTime()) }}</span>
              <input
                class="music-progress-range"
                type="range"
                min="0"
                [max]="activeTrack().duration || 0"
                step="1"
                [value]="currentTime()"
                [disabled]="!activeTrack().duration"
                aria-label="Tiến trình bài hát"
                [attr.aria-valuenow]="currentTime()"
                (input)="seekAudio($event)"
              >
              <span>{{ formatTime(activeTrack().duration) }}</span>
            </div>

            <label class="music-volume">
              <span aria-hidden="true">◖</span>
              <span class="sr-only">Âm lượng</span>
              <input type="range" min="0" max="100" step="1" [value]="volume() * 100" aria-label="Âm lượng" [attr.aria-valuenow]="volume() * 100" (input)="setVolume($event)">
              <span aria-hidden="true">◗</span>
            </label>

            <ol class="music-playlist" aria-label="Danh sách nhạc">
              @for (track of tracks; track track.id; let index = $index) {
                <li>
                  <button
                    class="music-track"
                    [class.is-active]="activeTrackIndex() === index"
                    type="button"
                    [attr.aria-current]="activeTrackIndex() === index ? 'true' : null"
                    [attr.aria-pressed]="activeTrackIndex() === index"
                    (click)="selectTrack(index)"
                  >
                    <span class="track-index">{{ (index + 1).toString().padStart(2, '0') }}</span>
                    <span class="track-copy"><strong>{{ track.title }}</strong><small>H ♡ Q · love archive</small></span>
                    <span class="track-state" aria-hidden="true">
                      @if (activeTrackIndex() === index && isPlaying()) {
                        <i></i><i></i><i></i>
                      } @else {
                        <span>{{ trackDuration(track) ? formatTime(trackDuration(track)) : '—' }}</span>
                      }
                    </span>
                  </button>
                </li>
              }
            </ol>

            <button
              class="treasure-control treasure-control--pause stream-control"
              type="button"
              [attr.aria-label]="paused() ? 'Tiếp tục trình chiếu kho báu' : 'Tạm dừng trình chiếu kho báu'"
              [attr.aria-pressed]="paused()"
              (click)="togglePause()"
            >
              <span class="pause-icon" aria-hidden="true"><i></i><i></i></span>
              {{ paused() ? 'Tiếp tục ảnh' : 'Tạm dừng ảnh' }}
            </button>

              <button class="treasure-control music-return" type="button" (click)="returnToLetter()">Quay lại lá thư <span aria-hidden="true">↗</span></button>
            </aside>
          </aside>
        </div>

        <p class="treasure-live sr-only">
          @if (selectedFrame(); as selected) {
            Đã chọn {{ selected.context.title || 'một kỷ niệm' }}.
          } @else {
            Chưa chọn ảnh kỷ niệm.
          }
        </p>
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-width:0; }
    .treasure-page {
      --treasure-night:#10070d;
      --treasure-rose:#eea2b3;
      --treasure-champagne:#f4d3a0;
      --treasure-ink:#fff7f0;
      width:min(1380px,calc(100% - 1.2rem));
      min-height:calc(100dvh - .8rem);
      margin:.4rem auto;
      overflow-x:clip;
      border:1px solid rgba(239,210,165,.12);
      border-radius:clamp(24px,3vw,42px);
      background:var(--hq-night,var(--treasure-night));
      box-shadow:0 24px 70px rgba(0,0,0,.38);
    }
    .treasure-stage {
      position:relative;
      isolation:isolate;
      min-height:calc(100dvh - 1rem);
      overflow:visible;
      border-radius:inherit;
      background:
        radial-gradient(circle at 50% 50%,rgba(123,53,73,.34),transparent 24rem),
        radial-gradient(circle at 16% 82%,rgba(231,160,177,.1),transparent 20rem),
        linear-gradient(145deg,#12080d,#1d0d14 55%,#0d0609);
    }
    .treasure-stage::before { position:absolute; inset:.75rem; z-index:1; border:1px solid rgba(244,211,160,.2); border-radius:calc(clamp(24px,3vw,42px) - .75rem); content:""; opacity:.7; pointer-events:none; }
    .treasure-stage::after { position:absolute; inset:0; z-index:0; background:linear-gradient(180deg,rgba(16,7,13,.5),transparent 30%,transparent 70%,rgba(16,7,13,.56)); content:""; pointer-events:none; }
    .treasure-vignette { position:absolute; inset:-12%; z-index:0; border-radius:50%; box-shadow:inset 0 0 13rem 6rem rgba(0,0,0,.58); pointer-events:none; }
    .treasure-layout {
      position:relative;
      z-index:2;
      display:grid;
      grid-template-columns:minmax(0,1fr) minmax(19rem,25rem);
      gap:clamp(1rem,3vw,3rem);
      min-height:calc(100dvh - 2.5rem);
      margin:0 auto;
      padding:clamp(1rem,2.5vw,2.25rem);
    }
    .treasure-artboard {
      display:grid;
      grid-template-rows:auto minmax(24rem,1fr) auto;
      min-width:0;
      min-height:calc(100dvh - 4.5rem);
      overflow:hidden;
      border:1px solid rgba(239,210,165,.13);
      border-radius:clamp(18px,2.5vw,30px);
      background:rgba(18,8,13,.3);
    }
    .galaxy-orbits { position:absolute; inset:0; z-index:0; width:100%; height:100%; overflow:visible; opacity:.34; pointer-events:none; transform:scale(.9); }
    .orbit { fill:none; stroke:rgba(244,211,160,.2); stroke-width:.16; stroke-dasharray:1.5 1.8; }
    .orbit--two { stroke:rgba(238,162,179,.25); }
    .orbit--three { stroke:rgba(244,211,160,.16); }
    .constellation-line { fill:none; stroke:rgba(238,162,179,.24); stroke-width:.11; stroke-dasharray:.8 1.8; }
    .constellation-line--lower { stroke:rgba(244,211,160,.17); }
    .constellation-star { fill:var(--treasure-champagne); filter:drop-shadow(0 0 3px rgba(244,211,160,.9)); }
    .star { position:absolute; z-index:2; color:var(--treasure-champagne); font-family:Georgia,serif; opacity:.46; text-shadow:0 0 12px rgba(244,211,160,.8); pointer-events:none; }
    .star--one { top:26%; left:11%; font-size:1.1rem; }
    .star--three { top:37%; right:10%; font-size:1.2rem; animation-delay:2s; }
    .star--five { bottom:16%; left:16%; font-size:.9rem; animation-delay:2.5s; }
    .star--six { top:66%; left:7%; animation-delay:1.6s; }
    .galaxy-core { position:absolute; top:50%; left:50%; z-index:1; display:grid; width:min(58%,22rem); aspect-ratio:1; place-items:center; border:1px solid rgba(244,211,160,.12); border-radius:50%; opacity:.56; transform:translate(-50%,-50%); pointer-events:none; }
    .galaxy-core::before,.galaxy-core::after { position:absolute; inset:9%; border:1px solid rgba(238,162,179,.12); border-radius:50%; content:""; }
    .galaxy-core::after { inset:22%; border-color:rgba(244,211,160,.15); }
    .core-halo { position:absolute; width:40%; aspect-ratio:1; border-radius:50%; background:rgba(238,162,179,.28); filter:blur(26px); }
    .core-seal { position:relative; display:grid; width:4.5rem; height:4.5rem; place-content:center; border:1px solid rgba(244,211,160,.7); border-radius:50%; outline:1px solid rgba(238,162,179,.26); outline-offset:5px; color:var(--treasure-champagne); font-family:var(--font-display); font-size:1rem; line-height:.75; text-align:center; }
    .core-seal i { color:var(--treasure-rose); font-style:normal; }
    .treasure-heading {
      position:relative;
      z-index:3;
      width:100%;
      min-width:0;
      padding:clamp(1.4rem,4vw,3rem) clamp(1rem,4vw,3.5rem) clamp(.75rem,2vw,1.25rem);
      display:grid;
      justify-items:center;
      margin:0;
      text-align:center;
      pointer-events:none;
    }
    .treasure-kicker { margin:0 0 1.15rem; color:rgba(244,211,160,.82); font-size:.62rem; font-weight:700; letter-spacing:.22em; text-transform:uppercase; }
    .treasure-kicker span { margin:0 .5rem; color:var(--treasure-rose); }
    h1 { width:100%; max-width:58rem; margin:0; color:var(--treasure-ink); font-family:var(--font-display); font-size:clamp(2.35rem,5.5vw,5.2rem); font-weight:400; letter-spacing:-.075em; line-height:.87; text-shadow:0 14px 35px rgba(0,0,0,.38); overflow-wrap:anywhere; }
    h1 em { display:block; color:var(--treasure-rose); font-style:italic; }
    .treasure-subtitle { max-width:32rem; margin:1.35rem 0 0; color:rgba(255,247,240,.66); font-family:var(--font-display); font-size:.92rem; line-height:1.7; }
    .treasure-guidance { margin:1rem 0 0; color:rgba(244,211,160,.68); font-size:.59rem; font-weight:700; letter-spacing:.15em; text-transform:uppercase; }
    .treasure-visual-zone {
      position:relative;
      min-width:0;
      min-height:clamp(24rem,38vw,38rem);
      overflow:hidden;
      isolation:isolate;
      border-top:1px solid rgba(239,210,165,.08);
      border-bottom:1px solid rgba(239,210,165,.08);
    }
    .treasure-stream { position:absolute; inset:0; z-index:2; overflow:hidden; pointer-events:none; }
    .treasure-photo { position:absolute; top:var(--photo-top); left:var(--photo-left); display:block; width:clamp(5.75rem,9vw,8rem); max-width:25%; aspect-ratio:4 / 5; margin:0; padding:0; border:0; background:transparent; cursor:pointer; opacity:1; filter:brightness(var(--photo-brightness)); transform:translate(-50%,-50%) rotate(var(--photo-rotation)) scale(var(--photo-scale)); pointer-events:auto; transition:filter 300ms var(--ease-out),transform 300ms var(--ease-out); }
    .photo-aura { position:absolute; inset:8%; border-radius:50%; background:rgba(238,162,179,.38); filter:blur(24px); opacity:.42; }
    .photo-paper { position:absolute; inset:0; padding:.36rem .36rem 1.15rem; background:#fff9f1; box-shadow:0 22px 42px rgba(0,0,0,.46),0 0 24px rgba(238,162,179,.12); will-change:transform,opacity,filter; transform:translateZ(0); animation:treasure-paper-in var(--photo-duration) var(--ease-cinematic) var(--photo-delay) both; }
    .photo-paper app-media-frame { display:block; width:100%; height:100%; }
    .treasure-photo:hover,.treasure-photo:focus-visible { filter:brightness(1.08); outline:0; }
    .treasure-photo.is-selected { z-index:20!important; filter:none; transform:translate(-50%,-50%) scale(1.08) rotate(0deg); }
    .treasure-photo.is-selected .photo-paper { animation:none; opacity:1; filter:none; transform:none; box-shadow:0 28px 68px rgba(0,0,0,.54),0 0 44px rgba(238,162,179,.35); }
    .treasure-photo.is-selected .photo-aura { opacity:1; transform:scale(1.25); }
    .treasure-photo:focus-visible .photo-paper { outline:3px solid var(--treasure-champagne); outline-offset:5px; }
    .treasure-empty { position:absolute; top:50%; left:50%; margin:0; color:rgba(255,247,240,.72); font-family:var(--font-display); transform:translate(-50%,-50%); }
    .treasure-footer {
      display:grid;
      gap:.7rem;
      min-width:0;
      padding:clamp(.85rem,2vw,1.35rem) clamp(1rem,3vw,2.5rem) clamp(1rem,2vw,1.5rem);
    }
    .treasure-note {
      position:relative;
      min-height:2.2rem;
      padding-inline:.5rem;
      display:grid;
      justify-items:center;
      color:rgba(255,247,240,.64);
      font-family:var(--font-display);
      font-size:clamp(.88rem,1.5vw,1.08rem);
      line-height:1.4;
      text-align:center;
      pointer-events:none;
    }
    .treasure-note span { max-width:42rem; }
    .treasure-memory-panel {
      position:relative;
      width:min(100%,38rem);
      display:grid;
      justify-items:center;
      margin:0;
      padding:1rem clamp(2.25rem,5vw,3rem) 1rem 1.25rem;
      border:1px solid rgba(239,210,165,.2);
      border-radius:18px;
      background:rgba(24,10,17,.84);
      box-shadow:0 22px 60px rgba(0,0,0,.26);
      backdrop-filter:blur(18px);
      text-align:center;
    }
    .treasure-bottom {
      position:relative;
      display:flex;
      justify-content:center;
      min-width:0;
      pointer-events:none;
    }
    .stream-counter { display:flex; align-items:center; flex-wrap:wrap; justify-content:center; gap:.65rem; margin:0; color:rgba(244,211,160,.78); font-size:.59rem; font-weight:700; letter-spacing:.15em; text-align:center; text-transform:uppercase; }
    .stream-counter span { color:var(--treasure-rose); font-family:var(--font-display); font-size:1rem; }
    .stream-counter i { width:2.4rem; height:1px; background:rgba(244,211,160,.44); }
    .stream-counter small { color:rgba(255,247,240,.46); font-size:.56rem; font-weight:600; }
    .panel-close { position:absolute; top:.25rem; right:.45rem; display:grid; width:32px; height:32px; place-items:center; border:0; background:transparent; color:rgba(255,247,240,.7); cursor:pointer; font-size:1.35rem; line-height:1; }
    .panel-close:hover { color:var(--treasure-champagne); }
    .panel-date { margin:0 0 .35rem; color:var(--treasure-champagne); font-size:.57rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; }
    .treasure-memory-panel h2 { max-width:32rem; margin:0; color:#fff9f1; font-family:var(--font-display); font-size:1.35rem; font-weight:400; line-height:1.08; overflow-wrap:anywhere; }
    .panel-caption { max-width:24rem; margin:.45rem 0 0; color:rgba(255,247,240,.67); font-family:var(--font-display); font-size:.78rem; line-height:1.45; }
    .panel-location { margin:.42rem 0 0; color:var(--treasure-rose); font-size:.62rem; letter-spacing:.08em; }
    .treasure-control { display:inline-flex; align-items:center; gap:.62rem; min-height:46px; padding:.72rem 1rem; border:1px solid rgba(244,211,160,.48); background:rgba(16,7,13,.62); color:rgba(255,247,240,.88); backdrop-filter:blur(12px); cursor:pointer; font-size:.67rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; transition:background 180ms ease,border-color 180ms ease,color 180ms ease,transform 180ms var(--ease-out); }
    .treasure-control:hover { border-color:var(--treasure-champagne); background:rgba(118,43,70,.76); color:#fffaf4; transform:translateY(-2px); }
    .treasure-page.is-paused :where(.treasure-photo,.photo-paper) { animation-play-state:paused; }
    .pause-icon { display:inline-flex; gap:3px; }
    .pause-icon i { display:block; width:2px; height:11px; background:currentColor; }
    .treasure-page.is-paused .pause-icon i { width:0; height:0; border-top:6px solid transparent; border-bottom:6px solid transparent; border-left:8px solid currentColor; }
    .treasure-page.is-paused .pause-icon i + i { display:none; }
    .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap; }
    @keyframes treasure-paper-in { 0% { opacity:0; filter:blur(11px); transform:translateY(10px) rotate(-8deg) scale(.7); } 17% { opacity:.98; filter:blur(0); transform:translateY(0) rotate(0deg) scale(1); } 68% { opacity:.96; filter:blur(0); transform:translateY(-3px) rotate(1deg) scale(1); } 100% { opacity:0; filter:blur(7px); transform:translateY(-12px) rotate(6deg) scale(.82); } }
    @media (prefers-reduced-motion:reduce) {
      .treasure-photo,.photo-paper,.treasure-memory-panel { animation:none!important; }
      .treasure-photo { opacity:1; filter:none; transform:translate(-50%,-50%) rotate(0deg) scale(1); }
      .photo-paper { opacity:.86; filter:none; transform:none; }
      .treasure-photo.is-selected { transform:translate(-50%,-50%) scale(1); }
      .treasure-control,.music-icon-button,.music-play-button,.music-track { transition:none; }
      .treasure-control:hover,.music-icon-button:hover,.music-play-button:hover,.music-track:hover { transform:none; }
    }

    .love-audio-source { position:absolute; width:1px; height:1px; opacity:0; pointer-events:none; }
    .music-column {
      display:grid;
      align-content:center;
      gap:clamp(1rem,2.5vw,1.75rem);
      min-width:0;
    }
    .record-stage {
      position:relative;
      width:min(100%,20rem);
      aspect-ratio:1;
      margin:0 auto;
      pointer-events:none;
      transform:none;
    }
    .record-halo { position:absolute; inset:8%; border-radius:50%; background:rgba(238,162,179,.25); filter:blur(42px); opacity:.78; }
    .vinyl-record { position:absolute; inset:8%; overflow:hidden; border:1px solid rgba(244,211,160,.5); border-radius:50%; background:#0b080d; box-shadow:0 24px 62px rgba(0,0,0,.58),inset 0 0 0 10px rgba(255,255,255,.02),0 0 46px rgba(238,162,179,.16); }
    .vinyl-disc-face { position:absolute; inset:0; overflow:hidden; border-radius:50%; background:repeating-radial-gradient(circle,#0b080d 0 2px,#1c0e17 2.5px 3.5px,#08060a 4px 5px); transform-origin:center; animation:vinyl-spin 15s linear infinite; animation-play-state:paused; }
    .treasure-page.is-playing .vinyl-disc-face { animation-play-state:running; }
    .vinyl-grooves { position:absolute; inset:6%; border:1px solid rgba(255,255,255,.08); border-radius:50%; box-shadow:inset 0 0 0 7px rgba(255,255,255,.025),inset 0 0 0 14px rgba(0,0,0,.28),inset 0 0 0 22px rgba(255,255,255,.025),inset 0 0 0 31px rgba(0,0,0,.28); }
    .vinyl-sheen { position:absolute; inset:0; border-radius:50%; background:linear-gradient(116deg,transparent 32%,rgba(255,255,255,.13) 43%,transparent 51%,rgba(238,162,179,.08) 68%,transparent 78%); mix-blend-mode:screen; }
    .vinyl-label { position:absolute; top:50%; left:50%; display:grid; width:33%; aspect-ratio:1; place-content:center; border:1px solid rgba(255,247,240,.42); border-radius:50%; background:radial-gradient(circle at 36% 30%,#e8b5be,#813449 72%); color:#fff4e9; font-family:var(--font-display); font-size:clamp(.8rem,1.4vw,1.1rem); line-height:.72; text-align:center; transform:translate(-50%,-50%); }
    .vinyl-label i { color:#f6d7a7; font-style:normal; }
    .vinyl-hole { position:absolute; top:50%; left:50%; width:6px; height:6px; border:1px solid rgba(255,247,240,.78); border-radius:50%; background:#1a0b13; transform:translate(-50%,-50%); }
    .record-arm { position:absolute; top:7%; right:0; width:38%; height:5px; border-radius:999px; background:linear-gradient(90deg,#f4d3a0,#fff6e8); box-shadow:0 0 10px rgba(244,211,160,.36); transform:rotate(-24deg); transform-origin:right center; transition:transform 900ms var(--ease-cinematic); }
    .treasure-page.is-playing .record-arm { transform:rotate(-8deg); }
    .record-needle { position:absolute; right:-2px; bottom:-7px; width:2px; height:12px; background:#e99aaa; transform:rotate(25deg); transform-origin:top center; }
    .music-panel {
      position:relative;
      display:grid;
      gap:.65rem;
      width:100%;
      min-width:0;
      padding:1rem;
      border:1px solid rgba(239,210,165,.24);
      border-radius:22px;
      background:linear-gradient(145deg,rgba(44,14,29,.94),rgba(16,7,13,.94));
      box-shadow:0 24px 64px rgba(0,0,0,.36),0 0 34px rgba(238,162,179,.1);
      backdrop-filter:blur(18px) saturate(1.06);
    }
    .music-panel-header { display:grid; gap:.3rem; min-width:0; }
    .music-panel-header p { margin:0; color:rgba(244,211,160,.74); font-size:.54rem; font-weight:700; letter-spacing:.18em; text-transform:uppercase; }
    .music-panel-header p span { margin:0 .35rem; color:var(--treasure-rose); }
    .music-panel-header h2 { margin:0; color:#fff7f0; font-family:var(--font-display); font-size:clamp(1.3rem,2.1vw,1.8rem); font-weight:400; line-height:1.08; overflow-wrap:anywhere; }
    .now-playing { display:grid; gap:.22rem; min-width:0; padding:.72rem .8rem; border-left:2px solid var(--treasure-rose); background:rgba(255,247,240,.045); }
    .now-playing p { margin:0; color:rgba(244,211,160,.7); font-size:.54rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; }
    .now-playing strong { min-width:0; overflow:hidden; color:#fff9f1; font-family:var(--font-display); font-size:1.16rem; font-weight:400; text-overflow:ellipsis; white-space:nowrap; }
    .now-playing span { color:rgba(255,247,240,.55); font-size:.6rem; letter-spacing:.05em; text-transform:uppercase; }
    .autoplay-hint,.audio-error { margin:0; color:rgba(255,247,240,.62); font-size:.62rem; line-height:1.45; }
    .audio-error { color:#f3b4be; }
    .autoplay-fallback { width:100%; min-height:44px; border:1px solid var(--treasure-champagne); border-radius:999px; background:var(--treasure-champagne); color:#26101b; cursor:pointer; font-size:.65rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
    .autoplay-fallback:hover { background:#fff0cf; }
    .music-transport { display:flex; align-items:center; justify-content:center; gap:1.1rem; }
    .music-icon-button,.music-play-button { display:grid; place-items:center; border:0; cursor:pointer; }
    .music-icon-button { width:44px; height:44px; background:transparent; color:rgba(255,247,240,.75); font-family:Georgia,serif; font-size:1.25rem; transition:color 180ms ease,transform 180ms var(--ease-out); }
    .music-icon-button:hover { color:var(--treasure-champagne); transform:scale(1.1); }
    .music-play-button { width:52px; height:52px; border:1px solid rgba(244,211,160,.72); border-radius:50%; background:var(--treasure-champagne); color:#26101b; font-size:.95rem; box-shadow:0 0 24px rgba(244,211,160,.18); transition:background 180ms ease,transform 180ms var(--ease-out); }
    .music-play-button:hover { background:#fff0cf; transform:scale(1.06); }
    .music-progress { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:.5rem; min-width:0; color:rgba(255,247,240,.5); font-size:.55rem; }
    .music-progress-range,.music-volume input { width:100%; height:3px; accent-color:var(--treasure-rose); cursor:pointer; }
    .music-progress-range:disabled { cursor:default; opacity:.4; }
    .music-volume { display:flex; align-items:center; gap:.5rem; color:rgba(244,211,160,.62); font-size:.75rem; }
    .music-volume input { flex:1; min-width:0; }
    .music-playlist { display:grid; gap:.28rem; min-width:0; margin:0; padding:0; list-style:none; }
    .music-track { display:grid; grid-template-columns:1.5rem minmax(0,1fr) auto; align-items:center; gap:.55rem; width:100%; min-height:48px; padding:.3rem .48rem; border:1px solid transparent; border-radius:12px; background:transparent; color:rgba(255,247,240,.7); cursor:pointer; text-align:left; transition:background 180ms ease,border-color 180ms ease,color 180ms ease,transform 180ms var(--ease-out); }
    .music-track:hover,.music-track:focus-visible { border-color:rgba(244,211,160,.28); background:rgba(255,247,240,.06); color:#fff9f1; outline:0; transform:translateX(2px); }
    .music-track.is-active { border-color:rgba(238,162,179,.35); background:rgba(118,43,70,.34); color:#fff9f1; }
    .track-index { color:rgba(244,211,160,.52); font-size:.57rem; font-weight:700; letter-spacing:.08em; }
    .music-track.is-active .track-index { color:var(--treasure-rose); }
    .track-copy { display:grid; min-width:0; gap:.16rem; }
    .track-copy strong { min-width:0; overflow:hidden; font-family:var(--font-display); font-size:.9rem; font-weight:400; text-overflow:ellipsis; white-space:nowrap; }
    .track-copy small { overflow:hidden; color:rgba(255,247,240,.4); font-size:.5rem; letter-spacing:.08em; text-overflow:ellipsis; text-transform:uppercase; white-space:nowrap; }
    .track-state { display:grid; min-width:2.2rem; place-items:center; color:rgba(244,211,160,.58); font-size:.55rem; }
    .track-state i { display:block; width:2px; height:12px; background:var(--treasure-rose); animation:equalizer 720ms ease-in-out infinite alternate; }
    .track-state i:nth-child(2) { animation-delay:180ms; }
    .track-state i:nth-child(3) { animation-delay:360ms; }
    .track-state:has(i) { display:flex; align-items:center; justify-content:center; gap:3px; }
    .music-return,.stream-control { justify-content:center; }
    .treasure-page.is-playing .record-halo { animation:halo-pulse 3.8s ease-in-out infinite alternate; }
    @keyframes vinyl-spin { to { transform:rotate(360deg); } }
    @keyframes equalizer { from { height:4px; opacity:.45; } to { height:15px; opacity:1; } }
    @keyframes halo-pulse { from { opacity:.45; transform:scale(.9); } to { opacity:.9; transform:scale(1.08); } }

    @media (max-width:959px) {
      .treasure-layout { grid-template-columns:minmax(0,1fr); min-height:0; }
      .treasure-artboard { min-height:0; }
      .music-column { grid-template-columns:minmax(12rem,.7fr) minmax(0,1.3fr); align-items:center; }
      .record-stage { width:min(100%,18rem); }
    }
    @media (max-width:680px) {
      .treasure-page { width:calc(100% - .6rem); margin:.3rem auto; border-radius:24px; }
      .treasure-stage { min-height:0; }
      .treasure-layout { gap:1.15rem; padding:.7rem; }
      .treasure-artboard { grid-template-rows:auto minmax(25rem,1fr) auto; border-radius:18px; }
      .treasure-heading { padding:1.5rem .9rem .75rem; }
      .treasure-heading h1 { max-width:100%; font-size:clamp(2rem,9.7vw,3.8rem); }
      .treasure-kicker { max-width:18rem; margin-bottom:.85rem; font-size:.53rem; line-height:1.7; }
      .treasure-subtitle { max-width:18rem; margin-top:1rem; font-size:.75rem; }
      .treasure-guidance { margin-top:.72rem; font-size:.51rem; letter-spacing:.1em; }
      .treasure-visual-zone { min-height:clamp(25rem,100vw,32rem); }
      .galaxy-core { width:min(65vw,17rem); }
      .core-seal { width:3.35rem; height:3.35rem; font-size:.75rem; }
      .treasure-photo { width:clamp(5.7rem,24vw,7.5rem); max-width:30%; }
      .photo-paper { padding:.24rem .24rem .82rem; }
      .treasure-footer { padding:.8rem .7rem 1rem; }
      .treasure-note { min-height:2rem; padding-inline:.25rem; font-size:.76rem; }
      .treasure-memory-panel { padding:.85rem 2.2rem .85rem .9rem; }
      .treasure-memory-panel h2 { font-size:1.05rem; }
      .panel-caption { font-size:.7rem; }
      .stream-counter { gap:.4rem; font-size:.5rem; }
      .stream-counter i { width:1.25rem; }
      .stream-counter small { font-size:.47rem; }
      .music-column { grid-template-columns:minmax(0,1fr); gap:1rem; }
      .record-stage { width:min(58vw,14rem); }
      .music-panel { padding:.8rem; border-radius:18px; }
      .music-panel-header h2 { font-size:1.25rem; }
      .now-playing { padding:.55rem .65rem; }
      .now-playing strong { font-size:1rem; }
      .music-transport { gap:.8rem; }
      .music-play-button { width:46px; height:46px; }
      .music-track { min-height:48px; padding:.28rem .35rem; }
      .track-copy strong { font-size:.78rem; }
      .track-copy small { font-size:.43rem; }
      .music-return { min-height:44px; font-size:.56rem; }
    }
    @media (prefers-reduced-motion:reduce) {
      .vinyl-record,.vinyl-disc-face,.treasure-page.is-playing .record-halo,.track-state i { animation:none; }
      .record-arm { transform:rotate(-14deg); transition:none; }
    }
  `]
})
export class LoveTreasurePage implements AfterViewInit, OnInit, OnDestroy {
  private readonly memoryService = inject(MemoryService);
  private readonly router = inject(Router);

  @ViewChild('audio') private audioRef?: ElementRef<HTMLAudioElement>;
  protected readonly tracks = LOVE_TRACKS;
  protected readonly photos: readonly MemoryMedia[] = this.memoryService.getAllImageMedia();
  protected readonly activePhotos = signal<readonly TreasurePhotoFrame[]>([]);
  protected readonly paused = signal(false);
  protected readonly selectedKey = signal<number | null>(null);
  protected readonly sequencePosition = signal(0);
  protected readonly totalPhotos = this.photos.length;
  protected readonly activeTrackIndex = signal(0);
  protected readonly currentTime = signal(0);
  protected readonly isPlaying = signal(false);
  protected readonly autoplayBlocked = signal(false);
  protected readonly audioError = signal(false);
  protected readonly volume = signal(.72);
  protected readonly activeTrack = computed(() => {
    const track = LOVE_TRACKS[this.activeTrackIndex()];
    return { ...track, duration: this.trackDurations()[track.id] ?? track.duration };
  });
  protected readonly currentLine = computed(() => TREASURE_LINES[this.copyIndex() % TREASURE_LINES.length]);
  protected readonly selectedFrame = computed(() => {
    const key = this.selectedKey();
    return key === null ? undefined : this.activePhotos().find((frame) => frame.key === key);
  });
  protected reducedMotion = false;
  protected activeLimit = 0;

  private readonly mediaContext = new Map<string, TreasureMemoryContext>(
    this.memoryService.getAllMemories().flatMap((memory: Memory) =>
      memory.images.map((media) => [media.id, {
        date: memory.date,
        title: memory.title,
        caption: media.caption || memory.caption,
        location: memory.location
      }] as const)
    )
  );
  private readonly copyIndex = signal(0);
  private readonly trackDurations = signal<Record<string, number>>({});
  private shouldResumeAudio = false;
  private pendingAudioPlay = false;
  private audioPlayWasAutoplay = false;
  private order: readonly MemoryMedia[] = [];
  private cursor = 0;
  private slotCursor = 0;
  private renderKey = 0;
  private sequenceCount = 0;
  private timer?: ReturnType<typeof setInterval>;
  private mediaQuery?: MediaQueryList;
  private readonly mediaQueryListener = (): void => this.configureActiveLimit();

  ngOnInit(): void {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mediaQuery = window.matchMedia('(max-width: 680px)');
    this.mediaQuery.addEventListener?.('change', this.mediaQueryListener);
    this.activeLimit = this.getActiveLimit();
    this.startNewCycle(new Set());
    this.seedStream();
    this.startStream();
  }

  ngAfterViewInit(): void {
    const audio = this.audioRef?.nativeElement;
    if (audio) {
      audio.volume = this.volume();
      this.playAudio(true);
    }
  }

  ngOnDestroy(): void {
    this.stopStream();
    this.shouldResumeAudio = false;
    this.pendingAudioPlay = false;
    this.audioRef?.nativeElement.pause();
    this.mediaQuery?.removeEventListener?.('change', this.mediaQueryListener);
  }

  @HostListener('document:keydown', ['$event'])
  protected handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.selectedKey() !== null) this.clearSelection();
  }

  protected togglePause(): void {
    if (this.paused()) {
      this.paused.set(false);
      this.startStream();
      return;
    }

    this.paused.set(true);
    this.stopStream();
  }

  protected selectPhoto(frame: TreasurePhotoFrame): void {
    this.selectedKey.set(this.selectedKey() === frame.key ? null : frame.key);
  }

  protected clearSelection(): void {
    this.selectedKey.set(null);
  }

  private getPhotoPlacements(): readonly PhotoPlacement[] {
    if (this.activeLimit <= 6) return MOBILE_PHOTO_PLACEMENTS;
    return window.innerWidth <= 900 ? TABLET_PHOTO_PLACEMENTS : DESKTOP_PHOTO_PLACEMENTS;
  }

  protected playAudio(isAutoplay = false): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    if (!isAutoplay) this.autoplayBlocked.set(false);
    this.audioError.set(false);
    this.shouldResumeAudio = true;
    this.pendingAudioPlay = true;
    this.audioPlayWasAutoplay = isAutoplay;
    if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      audio.load();
      return;
    }
    this.attemptAudioPlay();
  }

  protected onCanPlay(event: Event): void {
    if (event.currentTarget !== this.audioRef?.nativeElement || !this.pendingAudioPlay || !this.shouldResumeAudio) return;
    this.attemptAudioPlay();
  }

  private attemptAudioPlay(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio || !this.shouldResumeAudio) return;
    this.pendingAudioPlay = false;
    void audio.play().then(() => {
      this.autoplayBlocked.set(false);
      this.isPlaying.set(true);
    }).catch(() => {
      this.isPlaying.set(false);
      this.shouldResumeAudio = false;
      if (this.audioPlayWasAutoplay) this.autoplayBlocked.set(true);
      else this.audioError.set(true);
    });
  }

  protected togglePlayback(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    if (this.isPlaying()) {
      this.shouldResumeAudio = false;
      this.pendingAudioPlay = false;
      audio.pause();
      return;
    }
    this.playAudio();
  }

  protected selectTrack(index: number): void {
    if (index < 0 || index >= this.tracks.length) return;
    const audio = this.audioRef?.nativeElement;
    this.activeTrackIndex.set(index);
    this.currentTime.set(0);
    this.audioError.set(false);
    if (!audio) return;
    audio.pause();
    audio.src = this.tracks[index].src;
    audio.load();
    this.playAudio();
  }

  protected previousTrack(): void {
    const audio = this.audioRef?.nativeElement;
    if (audio && audio.currentTime > 4) {
      audio.currentTime = 0;
      this.currentTime.set(0);
      return;
    }
    this.selectTrack((this.activeTrackIndex() - 1 + this.tracks.length) % this.tracks.length);
  }

  protected nextTrack(): void {
    this.selectTrack((this.activeTrackIndex() + 1) % this.tracks.length);
  }

  protected onLoadedMetadata(event: Event): void {
    const audio = event.currentTarget as HTMLAudioElement;
    const expectedSource = new URL(this.activeTrack().src, document.baseURI).href;
    if ((audio.currentSrc || audio.src) !== expectedSource) return;
    const duration = audio.duration;
    if (!Number.isFinite(duration)) return;
    this.trackDurations.update((durations) => ({ ...durations, [this.activeTrack().id]: duration }));
  }

  protected onTimeUpdate(event: Event): void {
    this.currentTime.set((event.currentTarget as HTMLAudioElement).currentTime || 0);
  }

  protected onPlay(): void {
    this.autoplayBlocked.set(false);
    this.shouldResumeAudio = true;
    this.isPlaying.set(true);
  }

  protected onPause(): void {
    this.isPlaying.set(false);
  }

  protected onEnded(): void {
    this.nextTrack();
  }

  protected onAudioError(): void {
    this.isPlaying.set(false);
    this.shouldResumeAudio = false;
    this.pendingAudioPlay = false;
    this.audioError.set(true);
  }

  protected seekAudio(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const audio = this.audioRef?.nativeElement;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    this.currentTime.set(value);
  }

  protected setVolume(event: Event): void {
    const value = Math.max(0, Math.min(100, Number((event.target as HTMLInputElement).value))) / 100;
    if (!Number.isFinite(value)) return;
    this.volume.set(value);
    if (this.audioRef?.nativeElement) this.audioRef.nativeElement.volume = value;
  }

  protected trackDuration(track: LoveTrack): number {
    return this.trackDurations()[track.id] ?? track.duration;
  }

  protected formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
    const total = Math.floor(seconds);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  protected photoAriaLabel(frame: TreasurePhotoFrame): string {
    const label = frame.context.title || frame.context.caption || 'một kỷ niệm của chúng mình';
    return this.selectedKey() === frame.key ? `Đang giữ lại ${label}. Nhấn để bỏ giữ.` : `Giữ lại ${label}`;
  }

  protected formatDate(date: string): string {
    return this.memoryService.formatDate(date);
  }

  protected returnToLetter(): void {
    this.stopStream();
    void this.router.navigateByUrl('/birthday?stage=letter');
  }

  private getActiveLimit(): number {
    if (!this.totalPhotos) return 0;
    return Math.min(this.mediaQuery?.matches ? 6 : 8, this.totalPhotos);
  }

  private seedStream(): void {
    this.activePhotos.set([]);
    this.slotCursor = 0;
    for (let index = 0; index < this.activeLimit; index += 1) this.appendNextPhoto(index * 80);
  }

  private configureActiveLimit(): void {
    const nextLimit = this.getActiveLimit();
    if (nextLimit === this.activeLimit) return;
    this.activeLimit = nextLimit;
    this.selectedKey.set(null);
    this.startNewCycle(new Set());
    this.seedStream();
    if (!this.paused()) this.startStream();
  }

  private startNewCycle(activeIds: ReadonlySet<string>): void {
    const shuffled = this.shuffle(this.photos);
    if (shuffled.length < 2 || activeIds.size === 0) {
      this.order = shuffled;
      this.cursor = 0;
      return;
    }

    const firstAvailable = shuffled.findIndex((photo) => !activeIds.has(photo.id));
    this.order = firstAvailable > 0
      ? [...shuffled.slice(firstAvailable), ...shuffled.slice(0, firstAvailable)]
      : shuffled;
    this.cursor = 0;
  }

  private appendNextPhoto(delayMs: number): void {
    if (!this.totalPhotos || !this.activeLimit) return;

    const existing = this.activePhotos();
    const selected = this.selectedFrame();
    const rawSlot = this.slotCursor % this.activeLimit;
    const slot = selected && selected.slot === rawSlot ? (rawSlot + 1) % this.activeLimit : rawSlot;
    this.slotCursor = slot + 1;
    if (selected && selected.slot === slot) return;

    const activeIds = new Set(existing.filter((frame) => frame.slot !== slot).map((frame) => frame.media.id));
    const photo = this.nextPhoto(activeIds);
    const placement = this.getPlacement(slot);
    const frame: TreasurePhotoFrame = {
      key: ++this.renderKey,
      media: photo,
      context: this.mediaContext.get(photo.id) || {},
      slot,
      left: placement.left,
      top: placement.top,
      rotation: -8 + Math.random() * 16,
      scale: .84 + Math.random() * .17,
      brightness: .78 + Math.random() * .24,
      depth: 4 + ((slot + this.renderKey) % 5),
      delayMs,
      durationMs: Math.max(2400, this.getStreamInterval() * this.activeLimit - 70)
    };

    this.sequenceCount += 1;
    this.sequencePosition.set(((this.sequenceCount - 1) % this.totalPhotos) + 1);
    if (this.sequenceCount % 4 === 0) this.copyIndex.set((this.copyIndex() + 1) % TREASURE_LINES.length);
    this.activePhotos.update((frames) => [...frames.filter((item) => item.slot !== slot), frame].sort((a, b) => a.slot - b.slot));
  }

  private getPlacement(slot: number): { left: number; top: number } {
    const placements = this.getPhotoPlacements();
    return placements[slot % placements.length];
  }

  private nextPhoto(activeIds: ReadonlySet<string>): MemoryMedia {
    if (this.cursor >= this.order.length) this.startNewCycle(activeIds);

    let candidate = this.order[this.cursor++];
    if (!activeIds.has(candidate.id)) return candidate;

    for (let attempt = 0; attempt < this.order.length; attempt += 1) {
      if (this.cursor >= this.order.length) this.startNewCycle(activeIds);
      candidate = this.order[this.cursor++];
      if (!activeIds.has(candidate.id)) return candidate;
    }

    return candidate;
  }

  private startStream(): void {
    this.stopStream();
    if (this.paused() || !this.totalPhotos) return;
    this.timer = window.setInterval(() => this.appendNextPhoto(0), this.getStreamInterval());
  }

  private getStreamInterval(): number {
    return this.reducedMotion ? 1300 : 520;
  }

  private stopStream(): void {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
  }

  private shuffle(items: readonly MemoryMedia[]): readonly MemoryMedia[] {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }
}
