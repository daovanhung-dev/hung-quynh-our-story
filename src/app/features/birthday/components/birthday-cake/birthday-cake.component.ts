import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-birthday-cake',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="cake-section" aria-labelledby="cake-title">
      <p class="eyebrow">Một điều ước cho tuổi 22</p>
      <h2 id="cake-title">Ước một điều nhé.</h2>
      <p class="hint">Anh sẽ không hỏi em đã ước gì đâu.</p>

      <div class="cake" [class.blown]="blown()" aria-hidden="true">
        <div class="candles">
          @for (candle of candles; track candle) {
            <span class="candle"><i class="flame"></i><b></b></span>
          }
        </div>
        <div class="layer layer-top"></div>
        <div class="layer layer-bottom"></div>
        <div class="plate"></div>
        <span class="smoke smoke-1">⌁</span>
        <span class="smoke smoke-2">⌁</span>
        <span class="smoke smoke-3">⌁</span>
      </div>

      <button type="button" (click)="blowCandles()" [disabled]="blown()">
        {{ blown() ? 'Điều ước đã được gửi đi ♡' : 'Thổi nến ♡' }}
      </button>
      @if (blown()) {
        <p class="secret">Mong điều em vừa ước sẽ trở thành sự thật.</p>
      }
    </section>
  `,
  styles: [`
    :host { display:block; }
    .cake-section { display:grid; justify-items:center; min-height:82dvh; align-content:center; padding:5rem 1.2rem; background:linear-gradient(155deg,#171013,#2a171e 64%,#130c0f); color:#fff9f0; text-align:center; }
    .eyebrow { margin:0 0 .8rem; color:var(--champagne); font-size:.66rem; font-weight:600; letter-spacing:.18em; text-transform:uppercase; }
    h2 { margin:0; font-family:var(--font-display); font-size:clamp(3rem,7vw,6.8rem); font-weight:400; letter-spacing:-.06em; line-height:.9; }
    .hint { margin:1rem 0 3rem; color:rgba(255,249,240,.62); font-family:var(--font-display); font-size:1rem; }
    .cake { position:relative; width:min(76vw,360px); height:260px; }
    .layer { position:absolute; left:50%; transform:translateX(-50%); border:1px solid rgba(255,255,255,.14); background:linear-gradient(#f4dfc8,#e9c9ad); box-shadow:inset 0 -12px 0 rgba(127,59,75,.12); }
    .layer-top { bottom:78px; width:68%; height:72px; border-radius:18px 18px 8px 8px; }
    .layer-bottom { bottom:24px; width:86%; height:86px; border-radius:16px 16px 10px 10px; }
    .plate { position:absolute; bottom:11px; left:50%; width:96%; height:14px; border-radius:50%; background:#d8b57a; transform:translateX(-50%); opacity:.72; }
    .candles { position:absolute; top:35px; left:50%; z-index:3; display:flex; gap:48px; transform:translateX(-50%); }
    .candle { position:relative; display:block; width:10px; height:56px; border-radius:2px; background:repeating-linear-gradient(135deg,#fff8ef 0 8px,#a65462 8px 14px); }
    .flame { position:absolute; bottom:calc(100% + 4px); left:50%; width:16px; height:24px; border-radius:55% 45% 60% 40%; background:radial-gradient(circle at 50% 70%,#fff7b2 0 24%,#f2b45f 25% 62%,#d96b57 63%); transform:translateX(-50%) rotate(4deg); filter:drop-shadow(0 0 10px rgba(244,198,100,.75)); animation:flicker 1.1s ease-in-out infinite alternate; transform-origin:50% 100%; }
    .smoke { position:absolute; top:18px; z-index:4; color:rgba(255,255,255,.4); font-family:serif; font-size:2rem; opacity:0; }
    .smoke-1 { left:31%; } .smoke-2 { left:48%; } .smoke-3 { left:65%; }
    .blown .flame { opacity:0; transform:translateX(-50%) scale(.2); transition:opacity 280ms ease,transform 280ms ease; animation:none; }
    .blown .smoke { animation:smoke 1.8s ease-out both; }
    .blown .smoke-2 { animation-delay:.12s; } .blown .smoke-3 { animation-delay:.22s; }
    button { min-height:50px; margin-top:1.6rem; padding:.8rem 1.15rem; border:1px solid rgba(216,181,122,.7); background:transparent; color:#fff9f0; cursor:pointer; font-size:.72rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase; }
    button:disabled { cursor:default; opacity:.78; }
    .secret { margin:1rem 0 0; color:#f0d6a7; font-family:var(--font-display); font-size:1rem; animation:reveal 500ms ease both; }
    @keyframes flicker { from { transform:translateX(-50%) rotate(-4deg) scale(.94); } to { transform:translateX(-50%) rotate(5deg) scale(1.06); } }
    @keyframes smoke { 0% { opacity:0; transform:translateY(0) scale(.7); } 20% { opacity:.58; } 100% { opacity:0; transform:translate(8px,-70px) scale(1.3); } }
    @keyframes reveal { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
    @media (prefers-reduced-motion:reduce) { .flame,.smoke,.secret { animation:none; } }
  `]
})
export class BirthdayCakeComponent {
  protected readonly candles = [1, 2, 3];
  protected readonly blown = signal(false);
  protected blowCandles(): void { this.blown.set(true); }
}
