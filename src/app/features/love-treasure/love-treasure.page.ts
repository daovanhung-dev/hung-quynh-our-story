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

const TREASURE_LINES = [
  'Anh đã cất những ngày bình thường này thành một kho báu.',
  'Mỗi bức ảnh là một vì sao nhỏ trong câu chuyện H ♡ Q.',
  'Có những kỷ niệm không cần nói thành lời — chỉ cần em cười là anh nhớ.',
  'Điều anh thích nhất không phải nơi mình đến, mà là người luôn đi cùng anh.',
  'Mình cứ chụp thêm nhé, vì phía trước còn rất nhiều ngày đẹp.',
  'Kho báu này còn mở mãi, miễn là chúng mình vẫn chọn nhau mỗi ngày.'
] as const;

const DESKTOP_ORBIT_SLOTS = [
  { left: 16, top: 38 },
  { left: 30, top: 22 },
  { left: 50, top: 17 },
  { left: 70, top: 23 },
  { left: 84, top: 40 },
  { left: 78, top: 70 },
  { left: 57, top: 79 },
  { left: 29, top: 72 }
] as const;

const MOBILE_ORBIT_SLOTS = [
  { left: 14, top: 38 },
  { left: 37, top: 25 },
  { left: 65, top: 27 },
  { left: 86, top: 43 },
  { left: 72, top: 68 },
  { left: 25, top: 67 }
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
      <section class="treasure-stage" aria-labelledby="treasure-title">
        <div class="treasure-vignette" aria-hidden="true"></div>

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

        <header class="treasure-heading">
          <p class="treasure-kicker">H ♡ Q <span>·</span> memory constellation</p>
          <h1 id="treasure-title">Chúc mừng vợ yêu <em>khám phá được thêm một kho báu</em></h1>
          <p class="treasure-subtitle">Mỗi tấm ảnh là một vì sao nhỏ trong bầu trời của chúng mình.</p>
          <p class="treasure-guidance">Chạm vào một kỷ niệm để giữ lại lâu hơn.</p>
        </header>

        <audio
          #audio
          class="love-audio-source"
          preload="metadata"
          [src]="activeTrack().src"
          aria-hidden="true"
          (loadedmetadata)="onLoadedMetadata($event)"
          (timeupdate)="onTimeUpdate($event)"
          (play)="onPlay()"
          (pause)="onPause()"
          (ended)="onEnded()"
          (error)="onAudioError()"
        ></audio>

        <div class="music-console">
          <div class="record-stage" aria-hidden="true">
            <div class="record-halo"></div>
            <div class="vinyl-record">
              <span class="vinyl-grooves"></span>
              <span class="vinyl-sheen"></span>
              <span class="vinyl-label">H<br><i>♡</i> Q</span>
              <span class="vinyl-hole"></span>
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

        <p class="treasure-live sr-only" aria-live="polite">
          @if (selectedFrame(); as selected) {
            Đã chọn {{ selected.context.title || 'một kỷ niệm' }}.
          } @else {
            Chưa chọn ảnh kỷ niệm.
          }
        </p>

        <div class="treasure-bottom">
          @if (totalPhotos > 0) {
            <p class="stream-counter" aria-hidden="true">
              <span>{{ sequencePosition() }}</span><i></i><small>{{ totalPhotos }} kỷ niệm · vòng lặp vô tận</small>
            </p>
          }
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; }
    .treasure-page { --treasure-night:#10070d; --treasure-wine:#762b46; --treasure-rose:#eea2b3; --treasure-champagne:#f4d3a0; --treasure-ink:#fff7f0; min-height:100dvh; overflow:hidden; background:var(--treasure-night); color:var(--treasure-ink); }
    .treasure-stage { position:relative; isolation:isolate; display:block; min-height:calc(100dvh - 72px); overflow:hidden; background:radial-gradient(circle at 50% 48%,rgba(118,43,70,.5),transparent 24rem),radial-gradient(circle at 17% 84%,rgba(238,162,179,.15),transparent 22rem),radial-gradient(circle at 88% 18%,rgba(244,211,160,.12),transparent 20rem),var(--treasure-night); }
    .treasure-stage::before { position:absolute; inset:1rem; z-index:12; border:1px solid rgba(244,211,160,.2); content:""; pointer-events:none; }
    .treasure-stage::after { position:absolute; inset:0; z-index:11; background:linear-gradient(180deg,rgba(16,7,13,.62),transparent 26%,transparent 72%,rgba(16,7,13,.86)); content:""; pointer-events:none; }
    .treasure-vignette { position:absolute; inset:-12%; z-index:10; border-radius:50%; box-shadow:inset 0 0 13rem 6rem rgba(0,0,0,.58); pointer-events:none; }
    .galaxy-orbits { position:absolute; inset:12% 3% 10%; z-index:1; width:94%; height:78%; overflow:visible; opacity:.82; pointer-events:none; }
    .orbit { fill:none; stroke:rgba(244,211,160,.2); stroke-width:.16; stroke-dasharray:1.5 1.8; transform-box:fill-box; transform-origin:center; animation:orbit-breathe 12s ease-in-out infinite alternate; }
    .orbit--two { stroke:rgba(238,162,179,.25); animation-duration:16s; animation-direction:alternate-reverse; }
    .orbit--three { stroke:rgba(244,211,160,.16); animation-duration:19s; }
    .constellation-line { fill:none; stroke:rgba(238,162,179,.24); stroke-width:.11; stroke-dasharray:.8 1.8; }
    .constellation-line--lower { stroke:rgba(244,211,160,.17); }
    .constellation-star { fill:var(--treasure-champagne); filter:drop-shadow(0 0 3px rgba(244,211,160,.9)); }
    .star { position:absolute; z-index:2; color:var(--treasure-champagne); font-family:Georgia,serif; opacity:.76; text-shadow:0 0 12px rgba(244,211,160,.8); animation:star-twinkle 3.8s ease-in-out infinite; pointer-events:none; }
    .star--one { top:26%; left:11%; font-size:1.1rem; }
    .star--three { top:37%; right:10%; font-size:1.2rem; animation-delay:2s; }
    .star--five { bottom:16%; left:16%; font-size:.9rem; animation-delay:2.5s; }
    .star--six { top:66%; left:7%; animation-delay:1.6s; }
    .galaxy-core { position:absolute; top:54%; left:50%; z-index:2; display:grid; width:min(35vw,25rem); aspect-ratio:1; place-items:center; border:1px solid rgba(244,211,160,.12); border-radius:50%; opacity:.84; transform:translate(-50%,-50%); pointer-events:none; }
    .galaxy-core::before,.galaxy-core::after { position:absolute; inset:9%; border:1px solid rgba(238,162,179,.12); border-radius:50%; content:""; animation:core-pulse 5s ease-in-out infinite; }
    .galaxy-core::after { inset:22%; border-color:rgba(244,211,160,.15); animation-delay:1s; }
    .core-halo { position:absolute; width:40%; aspect-ratio:1; border-radius:50%; background:rgba(238,162,179,.28); filter:blur(26px); animation:core-pulse 4.5s ease-in-out infinite alternate; }
    .core-seal { position:relative; display:grid; width:4.5rem; height:4.5rem; place-content:center; border:1px solid rgba(244,211,160,.7); border-radius:50%; outline:1px solid rgba(238,162,179,.26); outline-offset:5px; color:var(--treasure-champagne); font-family:var(--font-display); font-size:1rem; line-height:.75; text-align:center; }
    .core-seal i { color:var(--treasure-rose); font-style:normal; }
    .treasure-heading { position:absolute; top:clamp(3.6rem,9vh,6rem); right:1rem; left:1rem; z-index:13; display:grid; justify-items:center; margin:auto; text-align:center; pointer-events:none; }
    .treasure-kicker { margin:0 0 1.15rem; color:rgba(244,211,160,.82); font-size:.62rem; font-weight:700; letter-spacing:.22em; text-transform:uppercase; }
    .treasure-kicker span { margin:0 .5rem; color:var(--treasure-rose); }
    h1 { max-width:68rem; margin:0; color:var(--treasure-ink); font-family:var(--font-display); font-size:clamp(2.7rem,6vw,6.1rem); font-weight:400; letter-spacing:-.075em; line-height:.87; text-shadow:0 14px 35px rgba(0,0,0,.38); }
    h1 em { display:block; color:var(--treasure-rose); font-style:italic; }
    .treasure-subtitle { max-width:28rem; margin:1.35rem 0 0; color:rgba(255,247,240,.66); font-family:var(--font-display); font-size:.92rem; line-height:1.7; }
    .treasure-guidance { margin:1rem 0 0; color:rgba(244,211,160,.68); font-size:.59rem; font-weight:700; letter-spacing:.15em; text-transform:uppercase; }
    .treasure-stream { position:absolute; inset:0; z-index:5; overflow:hidden; pointer-events:none; }
    .treasure-photo { position:absolute; left:var(--photo-left); top:var(--photo-top); display:block; width:clamp(8rem,13vw,11rem); aspect-ratio:4 / 5; margin:0; padding:0; border:0; background:transparent; cursor:pointer; opacity:1; filter:brightness(var(--photo-brightness)); transform:translate(-50%,-50%) rotate(var(--photo-rotation)) scale(var(--photo-scale)); pointer-events:auto; transition:filter 300ms var(--ease-out),transform 300ms var(--ease-out); }
    .photo-aura { position:absolute; inset:8%; border-radius:50%; background:rgba(238,162,179,.38); filter:blur(24px); opacity:.42; }
    .photo-paper { position:absolute; inset:0; padding:.36rem .36rem 1.15rem; background:#fff9f1; box-shadow:0 22px 42px rgba(0,0,0,.46),0 0 24px rgba(238,162,179,.12); will-change:transform,opacity,filter; transform:translateZ(0); animation:treasure-paper-in var(--photo-duration) var(--ease-cinematic) var(--photo-delay) both; }
    .photo-paper app-media-frame { display:block; width:100%; height:100%; }
    .treasure-photo:hover,.treasure-photo:focus-visible { opacity:1; filter:brightness(1.08); outline:0; }
    .treasure-photo.is-selected { left:50%; top:53%; z-index:20!important; opacity:1; filter:none; transform:translate(-50%,-50%) scale(1.08) rotate(0deg); }
    .treasure-photo.is-selected .photo-paper { animation:none; opacity:1; filter:none; transform:none; }
    .treasure-photo.is-selected .photo-aura { opacity:1; transform:scale(1.25); }
    .treasure-photo.is-selected .photo-paper { box-shadow:0 28px 68px rgba(0,0,0,.54),0 0 44px rgba(238,162,179,.35); }
    .treasure-photo:focus-visible .photo-paper { outline:3px solid var(--treasure-champagne); outline-offset:5px; }
    .treasure-empty { position:absolute; inset:50% auto auto 50%; margin:0; color:rgba(255,247,240,.72); font-family:var(--font-display); transform:translate(-50%,-50%); }
    .treasure-note { position:absolute; right:1rem; bottom:7.8rem; left:1rem; z-index:13; display:grid; justify-items:center; min-height:2rem; color:rgba(255,247,240,.64); font-family:var(--font-display); font-size:clamp(.88rem,1.5vw,1.08rem); line-height:1.4; text-align:center; pointer-events:none; }
    .treasure-note span { max-width:30rem; padding:.3rem .7rem; }
    .treasure-memory-panel { position:absolute; right:1rem; bottom:9.7rem; left:1rem; z-index:21; display:grid; justify-items:center; width:min(calc(100% - 2rem),28rem); margin:auto; padding:1rem 2rem .9rem; border:1px solid rgba(244,211,160,.36); background:rgba(29,10,20,.8); box-shadow:0 18px 42px rgba(0,0,0,.3),0 0 28px rgba(238,162,179,.12); backdrop-filter:blur(16px); text-align:center; animation:panel-in 420ms var(--ease-out) both; }
    .panel-close { position:absolute; top:.25rem; right:.45rem; display:grid; width:32px; height:32px; place-items:center; border:0; background:transparent; color:rgba(255,247,240,.7); cursor:pointer; font-size:1.35rem; line-height:1; }
    .panel-close:hover { color:var(--treasure-champagne); }
    .panel-date { margin:0 0 .35rem; color:var(--treasure-champagne); font-size:.57rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; }
    .treasure-memory-panel h2 { margin:0; color:#fff9f1; font-family:var(--font-display); font-size:1.35rem; font-weight:400; line-height:1.08; }
    .panel-caption { max-width:24rem; margin:.45rem 0 0; color:rgba(255,247,240,.67); font-family:var(--font-display); font-size:.78rem; line-height:1.45; }
    .panel-location { margin:.42rem 0 0; color:var(--treasure-rose); font-size:.62rem; letter-spacing:.08em; }
    .treasure-bottom { position:absolute; right:1rem; bottom:max(1.35rem,env(safe-area-inset-bottom)); left:1rem; z-index:22; display:grid; justify-items:center; gap:.72rem; pointer-events:none; }
    .stream-counter { display:flex; align-items:center; gap:.65rem; margin:0; color:rgba(244,211,160,.78); font-size:.59rem; font-weight:700; letter-spacing:.15em; text-transform:uppercase; }
    .stream-counter span { color:var(--treasure-rose); font-family:var(--font-display); font-size:1rem; }
    .stream-counter i { width:2.4rem; height:1px; background:rgba(244,211,160,.44); }
    .stream-counter small { color:rgba(255,247,240,.46); font-size:.56rem; font-weight:600; }
    .treasure-control { display:inline-flex; align-items:center; gap:.62rem; min-height:46px; padding:.72rem 1rem; border:1px solid rgba(244,211,160,.48); background:rgba(16,7,13,.62); color:rgba(255,247,240,.88); backdrop-filter:blur(12px); cursor:pointer; font-size:.67rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; transition:background 180ms ease,border-color 180ms ease,color 180ms ease,transform 180ms var(--ease-out); }
    .treasure-control:hover { border-color:var(--treasure-champagne); background:rgba(118,43,70,.76); color:#fffaf4; transform:translateY(-2px); }
    .treasure-page.is-paused :where(.treasure-photo,.photo-paper,.orbit,.star,.galaxy-core::before,.galaxy-core::after,.core-halo) { animation-play-state:paused; }
    .pause-icon { display:inline-flex; gap:3px; }
    .pause-icon i { display:block; width:2px; height:11px; background:currentColor; }
    .treasure-page.is-paused .pause-icon i { width:0; height:0; border-top:6px solid transparent; border-bottom:6px solid transparent; border-left:8px solid currentColor; }
    .treasure-page.is-paused .pause-icon i + i { display:none; }
    .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap; }
    @keyframes treasure-paper-in { 0% { opacity:0; filter:blur(11px); transform:translateY(10px) rotate(-8deg) scale(.7); } 17% { opacity:.98; filter:blur(0); transform:translateY(0) rotate(0deg) scale(1); } 68% { opacity:.96; filter:blur(0); transform:translateY(-3px) rotate(1deg) scale(1); } 100% { opacity:0; filter:blur(7px); transform:translateY(-12px) rotate(6deg) scale(.82); } }
    @keyframes orbit-breathe { from { opacity:.46; transform:rotate(-3deg) scale(.98); } to { opacity:1; transform:rotate(3deg) scale(1.02); } }
    @keyframes star-twinkle { 0%,100% { opacity:.36; transform:scale(.72); } 50% { opacity:.94; transform:scale(1.12); } }
    @keyframes core-pulse { 0%,100% { opacity:.38; transform:scale(.96); } 50% { opacity:.9; transform:scale(1.04); } }
    @keyframes panel-in { from { opacity:0; transform:translateY(10px) scale(.98); } to { opacity:1; transform:none; } }
    @media (prefers-reduced-motion:reduce) {
      .treasure-photo,.photo-paper,.orbit,.star,.galaxy-core::before,.galaxy-core::after,.core-halo,.treasure-memory-panel { animation:none!important; }
      .treasure-photo { opacity:1; filter:none; transform:translate(-50%,-50%) rotate(0deg) scale(1); }
      .photo-paper { opacity:.86; filter:none; transform:none; }
      .treasure-photo.is-selected { transform:translate(-50%,-50%) scale(1); }
      .treasure-control { transition:none; }
      .treasure-control:hover { transform:none; }
    }
    @media (max-width:680px) {
      .treasure-stage { min-height:calc(100dvh - 116px); }
      .treasure-stage::before { inset:.65rem; }
      .treasure-heading { top:2.8rem; }
      .treasure-kicker { max-width:18rem; margin-bottom:.85rem; font-size:.53rem; line-height:1.7; }
      h1 { max-width:20rem; font-size:clamp(2.05rem,9.7vw,3.8rem); }
      .treasure-subtitle { max-width:18rem; margin-top:1rem; font-size:.75rem; }
      .treasure-guidance { margin-top:.72rem; font-size:.51rem; letter-spacing:.1em; }
      .galaxy-orbits { inset:18% 0 12%; width:100%; height:70%; }
      .galaxy-core { top:54%; width:16rem; opacity:.68; }
      .core-seal { width:3.35rem; height:3.35rem; font-size:.75rem; }
      .treasure-photo { width:clamp(5.9rem,24vw,7.5rem); }
      .photo-paper { padding:.24rem .24rem .82rem; }
      .treasure-note { bottom:7.6rem; font-size:.76rem; }
      .treasure-memory-panel { bottom:9.2rem; width:min(calc(100% - 1.6rem),20rem); padding:.75rem 1.7rem .72rem; }
      .treasure-memory-panel h2 { font-size:1.05rem; }
      .panel-caption { font-size:.7rem; }
      .treasure-bottom { right:.8rem; bottom:max(.82rem,env(safe-area-inset-bottom)); left:.8rem; }
      .stream-counter { gap:.4rem; font-size:.5rem; }
      .stream-counter i { width:1.25rem; }
      .stream-counter small { font-size:.47rem; }
      .treasure-control { flex:1; justify-content:center; min-height:48px; padding-inline:.48rem; font-size:.55rem; letter-spacing:.06em; }
      .star--one { left:6%; }
      .star--three { right:4%; }
    }
    @media (max-width:360px) {
      .treasure-heading { top:2.4rem; }
      h1 { font-size:2rem; }
      .treasure-photo { width:5.7rem; }
      .treasure-note { bottom:7.45rem; font-size:.7rem; }
      .treasure-memory-panel { bottom:9rem; }
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
    if (!audio) return;
    audio.volume = this.volume();
    void this.playAudio(true);
  }

  ngOnDestroy(): void {
    this.stopStream();
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

  protected playAudio(isAutoplay = false): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    if (!isAutoplay) this.autoplayBlocked.set(false);
    this.audioError.set(false);
    void audio.play().then(() => {
      this.autoplayBlocked.set(false);
      this.isPlaying.set(true);
    }).catch(() => {
      this.isPlaying.set(false);
      this.autoplayBlocked.set(true);
    });
  }

  protected togglePlayback(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    if (this.isPlaying()) {
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
    const duration = (event.currentTarget as HTMLAudioElement).duration;
    if (!Number.isFinite(duration)) return;
    this.trackDurations.update((durations) => ({ ...durations, [this.activeTrack().id]: duration }));
  }

  protected onTimeUpdate(event: Event): void {
    this.currentTime.set((event.currentTarget as HTMLAudioElement).currentTime || 0);
  }

  protected onPlay(): void {
    this.autoplayBlocked.set(false);
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
      left: placement.left + (-2 + Math.random() * 4),
      top: placement.top + (-2 + Math.random() * 4),
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
    const slots = this.activeLimit <= 6 ? MOBILE_ORBIT_SLOTS : DESKTOP_ORBIT_SLOTS;
    return slots[slot % slots.length];
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
