import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MemoryService } from '../../core/services/memory.service';
import type { MemoryMedia } from '../../core/models/memory.model';
import { PhotoViewerComponent } from '../../shared/components/photo-viewer/photo-viewer.component';
import { getDaysApart, getMillisecondsUntilVietnamMidnight, formatJapanClock, formatVietnamClock } from './days-apart';
import { parseLetterSegments, type LetterSegment } from './letter-parser';
import { MissYouMusicPlayerComponent } from './miss-you-music-player.component';

const HEART_PHOTO_IDS = [
  '2026-02-14-img-4403',
  '2026-04-26-img-0039',
  '2026-07-11-img-6766',
  '2026-07-12-img-6776'
] as const;

@Component({
  standalone: true,
  imports: [RouterLink, PhotoViewerComponent, MissYouMusicPlayerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="autumn-scene" aria-hidden="true">
      <img class="scene-image" src="images/illustrations/miss-you-autumn.webp" alt="" width="1600" height="900" (error)="backgroundUnavailable.set(true)" [class.is-unavailable]="backgroundUnavailable()">
      <div class="scene-overlay"></div>
      @if (!reducedMotion) {
        <div class="falling-leaves">
          <span>🍁</span><span>🍂</span><span>🍁</span><span>🍂</span><span>🍁</span><span>🍂</span><span>🍁</span>
        </div>
      }
    </div>

    <main class="miss-you-page" [class.is-ready]="ready" [class.reduced-motion]="reducedMotion">
      <div class="page-heading">
        <a class="return-link" routerLink="/" aria-label="Quay về góc kỷ niệm">← <span>Về góc kỷ niệm</span></a>
        <p class="page-kicker">H ♡ Q · một lời nhắn từ chồng</p>
      </div>

      <div class="miss-you-grid">
        <section class="days-panel" aria-labelledby="miss-you-title">
          <p class="date-label">TỪ 22.09.2026</p>
          <h1 id="miss-you-title" class="day-count" aria-label="{{ daysApart() }} ngày xa nhau">{{ daysApart() }}</h1>
          <p class="days-caption">NGÀY XA NHAU</p>
          <p class="days-promise">Mỗi ngày là một ngày gần em hơn.</p>
          <div class="clock-row" aria-label="Giờ địa phương">
            <span><b>Việt Nam</b><time>{{ vietnamClock() }}</time></span>
            <span class="clock-divider" aria-hidden="true">·</span>
            <span><b>Nhật Bản</b><time>{{ japanClock() }}</time></span>
          </div>
          <div class="japanese-love">
            <p lang="ja">僕はずっと君だけを愛してる</p>
            <span>Chồng mãi yêu mình em</span>
          </div>
        </section>

        <aside class="memory-music-panel" aria-label="Những điều nhắc chồng nhớ em">
          <app-miss-you-music-player />

          <section class="heart-gallery" aria-labelledby="heart-gallery-title">
            <div class="section-heading">
              <div>
                <p class="section-kicker">H ♡ Q · memory archive</p>
                <h2 id="heart-gallery-title">Ở trong tim chồng</h2>
              </div>
              <span aria-hidden="true">♡</span>
            </div>
            <svg class="heart-defs" aria-hidden="true" focusable="false" viewBox="0 0 100 100">
              <defs><clipPath id="miss-you-heart-mask" clipPathUnits="objectBoundingBox"><path d="M.5 .94 C.4 .83 .05 .62 .05 .34 C.05 .12 .22 .03 .38 .03 C.47 .03 .5 .11 .5 .11 C.5 .11 .56 .03 .66 .03 C.82 .03 .96 .14 .96 .34 C.96 .61 .62 .84 .5 .94 Z" /></clipPath></defs>
            </svg>
            @if (heartPhotos.length) {
              <div class="heart-photo-grid">
                @for (photo of heartPhotos; track photo.id; let index = $index) {
                  <button class="heart-photo" [class.is-featured]="index === 0" type="button" [attr.aria-label]="'Mở ảnh kỷ niệm ' + photo.alt" (click)="openPhoto(index)">
                    <img [src]="photo.thumbnailSrc || photo.displaySrc || photo.src" [attr.width]="photo.width || null" [attr.height]="photo.height || null" [alt]="photo.alt || 'Ảnh kỷ niệm của chúng mình'" [loading]="index === 0 ? 'eager' : 'lazy'">
                  </button>
                }
              </div>
            } @else {
              <p class="gallery-empty">Mình sẽ cất thêm ảnh ở đây nhé.</p>
            }
            <p class="gallery-caption">Những ngày bình thường, nhưng có em.</p>
          </section>
        </aside>

        <article class="letter-panel" aria-labelledby="letter-title" [attr.aria-busy]="letterLoading()">
          <header class="letter-heading">
            <p class="section-kicker">Một lá thư · gửi Quỳnh</p>
            <h2 id="letter-title">Chồng nhớ em.</h2>
            <span class="letter-rule" aria-hidden="true">✦</span>
          </header>
          @if (letterLoading()) {
            <p class="letter-status" role="status">Chồng đang mở lá thư cho em…</p>
          } @else if (letterError()) {
            <div class="letter-status letter-error" role="alert">
              <p>Lá thư chưa tải được. Chạm để thử lại nhé.</p>
              <button type="button" (click)="loadLetter()">Thử tải lại</button>
            </div>
          } @else {
            <div class="letter-copy">
              @for (segment of letterSegments(); track $index) {
                @if (segment.bold) { <strong>{{ segment.text }}</strong> } @else { <span>{{ segment.text }}</span> }
              }
            </div>
          }
          <p class="letter-endmark" aria-hidden="true">H ♡ Q</p>
        </article>
      </div>
    </main>

    @if (photoViewerIndex() !== null) {
      <app-photo-viewer [images]="heartPhotos" [initialIndex]="photoViewerIndex() ?? 0" (closed)="closePhotoViewer()" />
    }
  `,
  styles: [`
    :host { position:relative; isolation:isolate; display:block; min-height:100%; overflow:clip; background:#211b29; color:#fff8ec; }
    .autumn-scene { position:fixed; inset:0; z-index:-1; overflow:hidden; background:radial-gradient(ellipse at 52% 18%,#876653 0,#493d4a 43%,#211b29 100%); pointer-events:none; }
    .scene-image { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; opacity:.62; transition:opacity 400ms ease; }
    .scene-image.is-unavailable { opacity:0; }
    .scene-overlay { position:absolute; inset:0; background:linear-gradient(90deg,rgba(23,20,31,.72),rgba(29,24,34,.56) 48%,rgba(22,20,30,.7)),linear-gradient(0deg,rgba(22,20,30,.42),transparent 55%); }
    .falling-leaves { position:absolute; inset:0; overflow:hidden; }
    .falling-leaves span { position:absolute; top:-12%; color:#d97846; font-size:clamp(1rem,2vw,1.8rem); opacity:.55; animation:leaf-drift 15s linear infinite; }
    .falling-leaves span:nth-child(1) { left:8%; animation-delay:-4s; animation-duration:19s; }
    .falling-leaves span:nth-child(2) { left:26%; color:#c88852; animation-delay:-12s; animation-duration:22s; }
    .falling-leaves span:nth-child(3) { left:49%; animation-delay:-8s; animation-duration:18s; }
    .falling-leaves span:nth-child(4) { left:68%; color:#c88852; animation-delay:-15s; animation-duration:24s; }
    .falling-leaves span:nth-child(5) { left:83%; animation-delay:-10s; animation-duration:21s; }
    .falling-leaves span:nth-child(6) { left:94%; color:#c88852; animation-delay:-2s; animation-duration:20s; }
    .falling-leaves span:nth-child(7) { left:38%; animation-delay:-17s; animation-duration:23s; }
    .miss-you-page { position:relative; z-index:1; width:min(1500px,100%); margin:0 auto; padding:1.3rem clamp(1rem,3.5vw,3.4rem) clamp(2.5rem,5vw,4rem); opacity:0; transform:translateY(12px); transition:opacity 760ms ease,transform 760ms ease; }
    .miss-you-page.is-ready { opacity:1; transform:none; }
    .page-heading { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1rem; }
    .return-link { display:inline-flex; align-items:center; gap:.45rem; min-height:44px; padding:.4rem .6rem; border:1px solid rgba(255,248,236,.3); background:rgba(24,20,29,.3); color:#fff8ec; font-size:.75rem; text-decoration:none; }
    .return-link:hover { background:rgba(255,248,236,.1); }
    .page-kicker,.section-kicker { margin:0; color:#e2bd8e; font-size:.62rem; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }
    .miss-you-grid { display:grid; grid-template-columns:minmax(0,1.02fr) minmax(290px,.82fr) minmax(0,1.02fr); grid-template-areas:'letter days media'; gap:clamp(.8rem,1.6vw,1.5rem); align-items:stretch; }
    .days-panel,.memory-music-panel,.letter-panel { min-width:0; border:1px solid rgba(255,239,213,.26); box-shadow:0 20px 56px rgba(9,8,15,.25); }
    .days-panel { grid-area:days; align-self:center; display:flex; flex-direction:column; align-items:center; padding:clamp(1.6rem,3.3vw,3.2rem) clamp(1rem,2vw,2rem); background:linear-gradient(155deg,rgba(55,43,54,.78),rgba(28,26,38,.84)); text-align:center; backdrop-filter:blur(10px); }
    .date-label { margin:0; color:#efd4ab; font-size:.67rem; font-weight:700; letter-spacing:.2em; }
    .day-count { margin:.15rem 0 -.1rem; color:#fff4e0; font-family:var(--font-display,Georgia,serif); font-size:clamp(5rem,8.2vw,8.6rem); font-weight:400; font-variant-numeric:tabular-nums; letter-spacing:-.09em; line-height:1.12; text-shadow:0 0 34px rgba(244,203,140,.24); }
    .days-caption { margin:0; color:#e6b795; font-size:.68rem; font-weight:700; letter-spacing:.19em; }
    .days-promise { margin:.9rem 0 0; color:rgba(255,248,236,.78); font-family:var(--font-display,Georgia,serif); font-size:1.03rem; line-height:1.6; }
    .clock-row { display:flex; align-items:center; gap:.8rem; margin-top:1.6rem; color:rgba(255,248,236,.68); }
    .clock-row span:not(.clock-divider) { display:grid; gap:.18rem; }
    .clock-row b { font-size:.54rem; font-weight:600; letter-spacing:.13em; text-transform:uppercase; }
    .clock-row time { color:#fff4e0; font-size:.9rem; font-variant-numeric:tabular-nums; }
    .clock-divider { color:#d4a679; }
    .japanese-love { display:grid; gap:.3rem; width:100%; margin-top:1.8rem; padding-top:1.3rem; border-top:1px solid rgba(255,239,213,.2); }
    .japanese-love p { margin:0; color:#f3d9b5; font-family:'Noto Sans JP','Yu Gothic',sans-serif; font-size:clamp(1rem,1.4vw,1.25rem); line-height:1.7; overflow-wrap:anywhere; }
    .japanese-love span { color:rgba(255,248,236,.72); font-family:var(--font-display,Georgia,serif); font-size:.95rem; }
    .memory-music-panel { grid-area:media; display:grid; align-content:start; gap:.95rem; padding:1rem; background:rgba(26,23,32,.72); backdrop-filter:blur(9px); }
    .heart-gallery { padding:.25rem .1rem .1rem; }
    .section-heading { display:flex; align-items:center; justify-content:space-between; gap:.8rem; }
    .section-heading h2,.letter-heading h2 { margin:.28rem 0 0; color:#fff7ec; font-family:var(--font-display,Georgia,serif); font-size:clamp(1.2rem,1.8vw,1.6rem); font-weight:400; }
    .section-heading > span { color:#e4b38d; font-size:1.5rem; }
    .heart-defs { position:absolute; width:0; height:0; overflow:hidden; }
    .heart-photo-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.55rem; align-items:center; margin-top:.9rem; }
    .heart-photo { display:grid; width:100%; aspect-ratio:1; place-items:center; padding:.1rem; border:0; background:transparent; cursor:zoom-in; transition:filter 180ms ease,transform 180ms ease; }
    .heart-photo img { width:100%; height:100%; object-fit:cover; object-position:center; clip-path:url(#miss-you-heart-mask); filter:drop-shadow(0 5px 7px rgba(0,0,0,.28)); }
    .heart-photo:hover,.heart-photo:focus-visible { filter:brightness(1.12); transform:translateY(-3px) scale(1.025); }
    .gallery-caption,.gallery-empty { margin:.6rem 0 0; color:rgba(255,248,236,.66); font-family:var(--font-display,Georgia,serif); font-size:.8rem; line-height:1.55; text-align:center; }
    .letter-panel { grid-area:letter; display:flex; flex-direction:column; min-height:min(78dvh,820px); max-height:calc(100dvh - 11rem); overflow:hidden; background:linear-gradient(140deg,rgba(255,246,231,.97),rgba(251,233,214,.95)); color:#4e3a3d; }
    .letter-heading { flex:none; padding:1.3rem 1.35rem .7rem; text-align:center; }
    .letter-heading .section-kicker { color:#87505a; }
    .letter-heading h2 { color:#4c3439; font-size:1.65rem; }
    .letter-rule { display:block; margin-top:.5rem; color:#b47b6a; font-size:.85rem; }
    .letter-copy { min-height:0; padding:.4rem clamp(1.15rem,2vw,1.7rem) .8rem; overflow:auto; color:#4e3a3d; font-family:var(--font-display,Georgia,'Times New Roman',serif); font-size:clamp(1rem,1.15vw,1.08rem); line-height:1.85; white-space:pre-wrap; overflow-wrap:anywhere; scrollbar-color:rgba(127,59,75,.38) transparent; scrollbar-width:thin; }
    .letter-copy strong { color:#793e4e; font-weight:700; }
    .letter-copy span { white-space:inherit; }
    .letter-status { margin:auto; padding:1.5rem; color:#644c50; font-size:.88rem; line-height:1.7; text-align:center; }
    .letter-error button { min-height:44px; padding:.5rem .8rem; border:1px solid #7f3b4b; background:#7f3b4b; color:white; cursor:pointer; }
    .letter-endmark { flex:none; margin:0; padding:.6rem 1rem 1rem; color:#8e5960; font-size:.62rem; font-weight:700; letter-spacing:.16em; text-align:center; }
    @keyframes leaf-drift { 0% { transform:translate3d(0,-4vh,0) rotate(0); opacity:0; } 12% { opacity:.56; } 88% { opacity:.5; } 100% { transform:translate3d(6vw,112vh,0) rotate(320deg); opacity:0; } }
    @media (max-width:1180px) {
      .miss-you-grid { grid-template-columns:minmax(0,1fr) minmax(0,1fr); grid-template-areas:'days days' 'media media' 'letter letter'; }
      .days-panel { width:min(100%,680px); justify-self:center; }
      .memory-music-panel { grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr); align-items:start; }
      .letter-panel { min-height:auto; max-height:none; overflow:visible; }
      .letter-copy { max-height:none; overflow:visible; padding-bottom:1.4rem; }
    }
    @media (max-width:700px) {
      .miss-you-page { padding:1rem .75rem 2.2rem; }
      .page-heading { align-items:flex-start; margin-bottom:.75rem; }
      .page-kicker { max-width:11rem; padding-top:.55rem; font-size:.53rem; text-align:right; }
      .miss-you-grid { grid-template-columns:minmax(0,1fr); grid-template-areas:'days' 'media' 'letter'; gap:.8rem; }
      .days-panel { min-height:0; padding:1.5rem 1rem 1.35rem; }
      .day-count { font-size:clamp(5.2rem,24vw,7rem); }
      .days-promise { margin-top:.45rem; font-size:.95rem; }
      .clock-row { margin-top:1rem; }
      .japanese-love { margin-top:1.1rem; padding-top:.85rem; }
      .japanese-love p { font-size:1rem; }
      .memory-music-panel { grid-template-columns:minmax(0,1fr); gap:.85rem; padding:.8rem; }
      .heart-photo-grid { grid-template-columns:repeat(4,minmax(0,1fr)); gap:.35rem; }
      .letter-panel { display:block; min-height:0; max-height:none; overflow:visible; }
      .letter-heading { padding:1.1rem .9rem .55rem; }
      .letter-heading h2 { font-size:1.45rem; }
      .letter-copy { padding:.4rem 1rem 1rem; font-size:1.02rem; line-height:1.8; overflow:visible; }
      .letter-endmark { padding:.25rem 1rem 1.1rem; }
    }
    @media (max-width:360px) {
      .return-link { gap:.25rem; padding:.35rem .45rem; font-size:.67rem; }
      .page-kicker { max-width:9.5rem; font-size:.49rem; }
      .days-panel { padding-inline:.75rem; }
      .day-count { font-size:5rem; }
      .heart-photo-grid { gap:.18rem; }
      .letter-copy { padding-inline:.85rem; font-size:.98rem; }
    }
    @media (prefers-reduced-motion:reduce) {
      .miss-you-page,.scene-image,.heart-photo { transition:none; }
      .miss-you-page { opacity:1; transform:none; }
      .falling-leaves { display:none; }
      .vinyl-record { animation:none!important; }
    }
  `]
})
export class MissYouPage implements OnInit, OnDestroy {
  private readonly memoryService = inject(MemoryService);
  private letterAbortController?: AbortController;
  private midnightTimer?: ReturnType<typeof setTimeout>;
  private clockTimer?: ReturnType<typeof setInterval>;
  protected readonly ready = true;
  protected readonly daysApart = signal(getDaysApart());
  private readonly currentDate = signal(new Date());
  protected readonly vietnamClock = computed(() => formatVietnamClock(this.currentDate()));
  protected readonly japanClock = computed(() => formatJapanClock(this.currentDate()));
  protected readonly letterSegments = signal<readonly LetterSegment[]>([]);
  protected readonly letterLoading = signal(true);
  protected readonly letterError = signal(false);
  protected readonly photoViewerIndex = signal<number | null>(null);
  protected readonly backgroundUnavailable = signal(false);
  protected readonly reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  protected readonly heartPhotos = this.selectHeartPhotos();

  private readonly visibilityHandler = (): void => {
    if (document.visibilityState === 'visible') {
      this.refreshVietnamDate();
      this.currentDate.set(new Date());
      this.scheduleVietnamMidnight();
    }
  };

  ngOnInit(): void {
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.refreshVietnamDate();
    this.currentDate.set(new Date());
    this.scheduleVietnamMidnight();
    this.clockTimer = setInterval(() => this.currentDate.set(new Date()), 60_000);
    this.loadLetter();
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    if (this.midnightTimer) clearTimeout(this.midnightTimer);
    if (this.clockTimer) clearInterval(this.clockTimer);
    this.letterAbortController?.abort();
  }

  protected openPhoto(index: number): void {
    this.photoViewerIndex.set(index);
  }

  protected closePhotoViewer(): void {
    this.photoViewerIndex.set(null);
  }

  protected loadLetter(): void {
    this.letterAbortController?.abort();
    const controller = new AbortController();
    this.letterAbortController = controller;
    this.letterLoading.set(true);
    this.letterError.set(false);

    void fetch(new URL('content/love-letter-miss-you.md', document.baseURI), { signal: controller.signal, cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Letter request failed with ${response.status}`);
        return response.text();
      })
      .then((source) => {
        if (controller.signal.aborted) return;
        this.letterSegments.set(parseLetterSegments(source));
        this.letterLoading.set(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        this.letterLoading.set(false);
        this.letterError.set(true);
      });
  }

  private refreshVietnamDate(): void {
    this.daysApart.set(getDaysApart(new Date()));
  }

  private scheduleVietnamMidnight(): void {
    if (this.midnightTimer) clearTimeout(this.midnightTimer);
    this.midnightTimer = setTimeout(() => {
      this.refreshVietnamDate();
      this.currentDate.set(new Date());
      this.scheduleVietnamMidnight();
    }, getMillisecondsUntilVietnamMidnight());
  }

  private selectHeartPhotos(): readonly MemoryMedia[] {
    const memories = this.memoryService.getAllMemories();
    return HEART_PHOTO_IDS.flatMap((id) => {
      for (const memory of memories) {
        const media = memory.images.find((item) => item.id === id);
        if (media?.kind === 'image') {
          return [{
            ...media,
            alt: media.alt || `Ảnh kỷ niệm của chúng mình · ${this.memoryService.formatDate(memory.date)}`,
            caption: media.caption || this.memoryService.formatDate(memory.date)
          }];
        }
      }
      return [];
    });
  }
}
