import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
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
          <button type="button" (click)="proceed.emit()">Mở lá thư <span aria-hidden="true">↘</span></button>
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
    .after-open button { display: inline-flex; align-items: center; gap: .7rem; min-height: 48px; padding: .78rem 1rem; border: 1px solid var(--wine); background: var(--wine); color: #fffdf9; cursor: pointer; font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
    @keyframes reveal { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    @media (max-width:620px) { .gift { width: min(72vw,230px); } .gift-scene { gap:2rem; padding-inline:1rem; } .copy { width:min(100%,25rem); } h1 { font-size:clamp(2.5rem,12.5vw,4.4rem); } .copy > p:last-child { font-size:1rem; } .after-open { width:min(100%,22rem); } .after-open p { line-height:1.5; } .after-open button { width:100%; justify-content:center; min-height:52px; } }
    @media (prefers-reduced-motion:reduce) { .box,.lid,.bow,.light,.heart,.after-open { transition: none; animation: none; } }
  `]
})
export class GiftRevealComponent {
  @Input() photos: readonly MemoryMedia[] = [];
  @Output() readonly proceed = new EventEmitter<void>();
  protected readonly opened = signal(false);

  protected openGift(): void {
    if (this.opened()) return;
    this.opened.set(true);
  }
}
