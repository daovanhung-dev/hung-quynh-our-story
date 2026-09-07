import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
import type { MemoryMedia } from '../../../../core/models/memory.model';
import { AmbientPhotoGalleryComponent } from '../../../../shared/components/ambient-photo-gallery/ambient-photo-gallery.component';

@Component({
  selector: 'app-gift-reveal',
  standalone: true,
  imports: [AmbientPhotoGalleryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="gift-scene" aria-labelledby="gift-title">
      <div class="glow" aria-hidden="true"></div>
      <div class="gift-ambient">
        <app-ambient-photo-gallery [photos]="photos" layout="cluster" sizes="(max-width: 640px) 28vw, 16vw" />
      </div>
      <div class="copy">
        <p class="eyebrow">Món quà 01</p>
        <h1 id="gift-title">Có một món quà<br>anh đã giữ dành cho em.</h1>
        <p>Chạm vào hộp quà khi em sẵn sàng nhé.</p>
      </div>

      <button class="gift" type="button" [class.opened]="opened()" (click)="openGift()" aria-label="Mở món quà">
        <span class="lid"><i></i></span>
        <span class="box"><i></i></span>
        <span class="bow bow-left"></span>
        <span class="bow bow-right"></span>
        <span class="light" aria-hidden="true"></span>
        <span class="heart heart-1" aria-hidden="true">♡</span>
        <span class="heart heart-2" aria-hidden="true">♡</span>
        <span class="heart heart-3" aria-hidden="true">♥</span>
      </button>

      @if (opened()) {
        <div class="after-open">
          <p>Một lá thư nhỏ, dành cho cô gái của anh.</p>
          <button
            class="letter-trigger"
            type="button"
            [class.is-holding]="holdProgress() > 0 && !hiddenUnlockComplete()"
            [class.is-unlocked]="hiddenUnlockComplete()"
            [attr.aria-label]="hiddenUnlockComplete() ? 'Đã mở kho báu ảnh' : 'Mở lá thư. Giữ 3 giây để khám phá kho báu ảnh'"
            (click)="letterClick($event)"
            (pointerdown)="startPointerHold($event)"
            (pointerup)="endHold()"
            (pointercancel)="endHold()"
            (pointerleave)="endHold()"
            (keydown)="startKeyboardHold($event)"
            (keyup)="endKeyboardHold($event)"
            (blur)="endPointerHold()"
          >
            <span class="letter-trigger-label">Mở lá thư</span>
            <span aria-hidden="true">↘</span>
            <svg class="hold-ring" viewBox="0 0 100 100" aria-hidden="true">
              <rect class="hold-ring-track" x="1.5" y="1.5" width="97" height="97" rx="9" pathLength="100"></rect>
              <rect class="hold-ring-progress" x="1.5" y="1.5" width="97" height="97" rx="9" pathLength="100" [style.stroke-dashoffset]="100 - holdPercent()"></rect>
            </svg>
            <span
              class="sr-only"
              role="progressbar"
              aria-label="Tiến trình mở kho báu ảnh"
              aria-valuemin="0"
              aria-valuemax="100"
              [attr.aria-valuenow]="holdPercent()"
            >Giữ nút trong 3 giây để mở kho báu ảnh. Tiến trình {{ holdPercent() }} phần trăm.</span>
          </button>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .gift-scene { position: relative; isolation: isolate; display: grid; min-height: 100svh; min-height: 100dvh; place-items: center; align-content: center; gap: clamp(2.2rem, 6vw, 4.5rem); overflow: hidden; padding: max(4rem,env(safe-area-inset-top)) max(1.2rem,env(safe-area-inset-right)) max(4rem,env(safe-area-inset-bottom)) max(1.2rem,env(safe-area-inset-left)); background: linear-gradient(145deg,#f7eee6,#ead7c9); color: var(--ink); text-align: center; }
    .gift-scene::before { position: absolute; inset: 1rem; z-index: -1; border: 1px solid rgba(127,59,75,.15); content: ''; }
    .gift-ambient { position:absolute; inset:7% 6%; z-index:-1; opacity:.3; pointer-events:none; }
    .gift-ambient app-ambient-photo-gallery { width:100%; height:100%; }
    .glow { position: absolute; inset: 0; z-index: -2; background: radial-gradient(circle at 50% 58%,rgba(216,181,122,.34),transparent 24rem),radial-gradient(circle at 12% 18%,rgba(166,84,98,.09),transparent 20rem); }
    .copy { display: grid; justify-items: center; max-width: 760px; }
    .eyebrow { margin: 0 0 1rem; color: var(--wine); font-size: .67rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; }
    h1 { margin: 0; font-family: var(--font-display); font-size: clamp(3rem,7.5vw,7rem); font-weight: 400; letter-spacing: -.065em; line-height: .88; }
    .copy > p:last-child { max-width: 410px; margin: 1.25rem 0 0; color: var(--text-secondary); font-family: var(--font-display); font-size: clamp(1rem,2vw,1.25rem); line-height: 1.65; }
    .gift { position: relative; width: min(54vw,280px); aspect-ratio: 1.15; border: 0; background: transparent; cursor: pointer; filter: drop-shadow(0 28px 30px rgba(75,42,46,.2)); }
    .box,.lid { position: absolute; left: 50%; display: block; width: 78%; background: #fff8ef; transform: translateX(-50%); transition: transform 720ms var(--ease-cinematic),opacity 520ms var(--ease-out); }
    .box { bottom: 4%; height: 58%; border: 1px solid rgba(108,51,65,.18); }
    .lid { top: 23%; z-index: 3; height: 19%; border: 1px solid rgba(108,51,65,.2); }
    .box i,.lid i { position: absolute; top: 0; bottom: 0; left: 50%; width: 18%; background: var(--wine); transform: translateX(-50%); }
    .bow { position: absolute; top: 7%; z-index: 4; width: 25%; height: 24%; border: 8px solid var(--wine); border-radius: 50%; transition: transform 720ms var(--ease-cinematic),opacity 420ms ease; }
    .bow-left { left: 28%; transform: rotate(24deg); }
    .bow-right { right: 28%; transform: rotate(-24deg); }
    .light { position: absolute; top: 35%; left: 50%; z-index: 1; width: 7rem; height: 7rem; border-radius: 50%; background: rgba(255,223,163,.82); filter: blur(24px); opacity: 0; transform: translate(-50%,-50%) scale(.4); transition: opacity 600ms ease,transform 900ms var(--ease-out); }
    .heart { position: absolute; top: 33%; left: 50%; z-index: 5; color: var(--wine); font-family: Georgia,serif; font-size: 1.3rem; opacity: 0; transition: opacity 320ms ease,transform 1s var(--ease-out); }
    .opened .lid { transform: translate(-50%,-105%) rotate(-7deg); }
    .opened .bow-left { opacity: .8; transform: translate(-42px,-46px) rotate(-28deg); }
    .opened .bow-right { opacity: .8; transform: translate(42px,-46px) rotate(28deg); }
    .opened .light { opacity: .85; transform: translate(-50%,-50%) scale(1.5); }
    .opened .heart { opacity: .7; }
    .opened .heart-1 { transform: translate(-82px,-95px) rotate(-10deg); }
    .opened .heart-2 { transform: translate(56px,-120px) rotate(12deg); }
    .opened .heart-3 { transform: translate(-10px,-150px) scale(.75); }
    .after-open { display: grid; justify-items: center; gap: .85rem; animation: reveal 600ms var(--ease-out) both; }
    .after-open p { margin: 0; color: var(--text-secondary); font-family: var(--font-display); font-size: 1.05rem; }
    .letter-trigger { position:relative; display:inline-flex; align-items:center; gap:.7rem; min-height:48px; overflow:visible; padding:.78rem 1rem; border:1px solid var(--wine); background:var(--wine); color:#fffdf9; cursor:pointer; font-size:.72rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase; touch-action:none; transition:background 220ms ease,color 220ms ease,transform 220ms var(--ease-out); }
    .letter-trigger:hover,.letter-trigger.is-holding { background:#8f4657; transform:translateY(-2px); }
    .letter-trigger.is-unlocked { background:#4e2633; color:#f4d7a5; }
    .letter-trigger-label { position:relative; z-index:1; }
    .hold-ring { position:absolute; inset:-6px; z-index:0; width:calc(100% + 12px); height:calc(100% + 12px); overflow:visible; pointer-events:none; transform:rotate(-90deg); }
    .hold-ring rect { fill:none; stroke-width:1.6; }
    .hold-ring-track { stroke:rgba(255,255,255,.2); }
    .hold-ring-progress { stroke:#f4d7a5; stroke-dasharray:100; transition:stroke-dashoffset 70ms linear; }
    .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap; }
    @keyframes reveal { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    @media (max-width:620px) { .gift { width: min(72vw,230px); } .gift-scene { gap:2rem; padding-inline:1rem; } .copy { width:min(100%,25rem); } h1 { font-size:clamp(2.5rem,12.5vw,4.4rem); } .copy > p:last-child { font-size:1rem; } .after-open { width:min(100%,22rem); } .after-open p { line-height:1.5; } .letter-trigger { width:100%; justify-content:center; min-height:52px; } }
    @media (prefers-reduced-motion:reduce) { .box,.lid,.bow,.light,.heart,.after-open,.letter-trigger { transition: none; animation: none; } .letter-trigger:hover,.letter-trigger.is-holding { transform:none; } .hold-ring-progress { transition:none; } }
  `]
})
export class GiftRevealComponent implements OnDestroy {
  @Input() photos: readonly MemoryMedia[] = [];
  @Output() readonly proceed = new EventEmitter<void>();
  @Output() readonly hiddenRequested = new EventEmitter<void>();
  protected readonly opened = signal(false);
  protected readonly holdProgress = signal(0);
  protected readonly hiddenUnlockComplete = signal(false);

  private holdTimer?: ReturnType<typeof setTimeout>;
  private holdProgressTimer?: ReturnType<typeof setInterval>;
  private holdStartedAt = 0;
  private holdInput: 'pointer' | 'keyboard' | undefined;
  private suppressProceedClick = false;

  protected openGift(): void {
    if (this.opened()) return;
    this.opened.set(true);
  }

  ngOnDestroy(): void {
    this.clearHoldTimers();
  }

  protected letterClick(event: MouseEvent): void {
    if (this.holdInput === 'keyboard') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.suppressProceedClick) {
      event.preventDefault();
      event.stopPropagation();
      this.suppressProceedClick = false;
      return;
    }

    this.proceed.emit();
  }

  protected startPointerHold(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.beginHold('pointer');
  }

  protected startKeyboardHold(event: KeyboardEvent): void {
    if ((event.key !== ' ' && event.key !== 'Enter') || event.repeat) return;
    event.preventDefault();
    this.beginHold('keyboard');
  }

  protected endKeyboardHold(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.endHold();
    }
  }

  protected endHold(): void {
    this.clearHoldTimers();
    this.holdInput = undefined;
    if (!this.hiddenUnlockComplete()) this.holdProgress.set(0);
  }

  protected endPointerHold(): void {
    if (this.holdInput === 'pointer') this.endHold();
  }

  protected holdPercent(): number {
    return Math.round(this.holdProgress() * 100);
  }

  private beginHold(input: 'pointer' | 'keyboard'): void {
    if (this.hiddenUnlockComplete() || this.holdInput) return;

    this.holdInput = input;
    this.holdStartedAt = performance.now();
    this.holdProgress.set(0);
    this.holdProgressTimer = window.setInterval(() => {
      this.holdProgress.set(Math.min((performance.now() - this.holdStartedAt) / 3000, 1));
    }, 50);
    this.holdTimer = window.setTimeout(() => this.completeHiddenHold(), 3000);
  }

  private completeHiddenHold(): void {
    this.clearHoldTimers();
    this.holdInput = undefined;
    this.holdProgress.set(1);
    this.hiddenUnlockComplete.set(true);
    this.suppressProceedClick = true;
    this.hiddenRequested.emit();
  }

  private clearHoldTimers(): void {
    if (this.holdTimer !== undefined) window.clearTimeout(this.holdTimer);
    if (this.holdProgressTimer !== undefined) window.clearInterval(this.holdProgressTimer);
    this.holdTimer = undefined;
    this.holdProgressTimer = undefined;
  }
}
