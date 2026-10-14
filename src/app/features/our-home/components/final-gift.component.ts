import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FINAL_LETTER } from '../content/letters.content';

@Component({
  selector: 'app-final-gift',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="final-gift" [class.is-hugged]="hugged" [class.is-reduced-motion]="reducedMotion" data-finale>
      <p class="finale-kicker">H ♡ Q · Một món quà em có thể mở bất cứ lúc nào</p>
      <div class="gift-art" aria-hidden="true"><span class="spark spark-a">✦</span><span class="spark spark-b">✧</span><span class="spark spark-c">✦</span><span class="spark spark-d">✧</span><span class="spark spark-e">✦</span><span class="gift-box">♡</span><span class="hug-hearts"><span class="hug-heart hug-heart-a">♥</span><span class="hug-heart hug-heart-b">♥</span><span class="hug-heart hug-heart-c">♥</span><span class="hug-heart hug-heart-d">♥</span><span class="hug-heart hug-heart-e">♥</span></span></div>
      @if (stampCount < 4) {
        <p class="stamp-hint">Em đã nhặt được {{ stampCount }}/5 dấu ấn. Có thể ghé thêm vài góc, hoặc mở quà ngay bây giờ nhé.</p>
      } @else {
        <p class="stamp-hint">Em đã ghé qua {{ stampCount }}/5 góc nhỏ. Món quà vẫn luôn ở đây, lúc nào em muốn cũng được.</p>
      }
      <div class="letter-copy">
        @for (paragraph of finalParagraphs; track $index) {
          <p [class.letter-greeting]="$index === 0" [class.letter-signoff]="$index === finalParagraphs.length - 1">{{ paragraph }}</p>
        }
      </div>
      <p class="final-line">Em không phải đi qua những ngày xa nhà một mình. Chúng mình có nhau. ❤️</p>
      <div class="final-actions">
        <button class="primary-action" type="button" [attr.aria-pressed]="hugged" (click)="hug()">{{ hugged ? 'Chồng đã ôm vợ một cái rồi 🫂' : 'Chồng ôm vợ một cái nhé 🫂' }}</button>
        <div class="action-links">
          <button type="button" (click)="replay.emit()">Xem lại từ đầu</button>
          <button type="button" (click)="returnHome.emit()">Quay về căn nhà</button>
          <a routerLink="/events" (click)="returnHome.emit()">Về các lựa chọn</a>
          <a routerLink="/timeline" (click)="returnHome.emit()">Về góc kỷ niệm</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .final-gift { display: grid; justify-items: center; gap: 1rem; }
    .finale-kicker { margin: 0; color: var(--wine); font-size: .62rem; font-weight: 700; letter-spacing: .13em; text-align: center; text-transform: uppercase; }
    .gift-art { position: relative; display: grid; width: 130px; height: 100px; place-items: center; }
    .gift-box { position: relative; display: grid; width: 82px; height: 62px; place-items: center; border: 3px solid #ac795f; border-radius: 7px; background: linear-gradient(145deg, #f0d3ae, #d7a77e); color: #7b3a4c; font-size: 2rem; box-shadow: 0 11px 0 #9c6a55; animation: gift-box-appear 440ms cubic-bezier(.18, .75, .32, 1.2) both; }
    .gift-box::before { position: absolute; top: -13px; left: -5px; width: 86px; height: 17px; transform-origin: 8px 50%; border: 3px solid #ac795f; border-radius: 5px; background: #f5dcb7; content: ''; animation: gift-lid-open 520ms 90ms ease-out both; }
    .gift-box::after { position: absolute; top: -23px; left: 31px; width: 22px; height: 18px; transform-origin: 50% 100%; border: 4px solid #a65462; border-radius: 14px 14px 4px 14px; transform: rotate(-20deg); content: ''; animation: gift-bow-lift 520ms 90ms ease-out both; }
    .spark { position: absolute; top: 50%; left: 50%; z-index: 1; color: #b8864e; font-size: 1.4rem; opacity: 0; animation: gift-spark-burst 620ms 130ms ease-out both; }
    .spark-a { --spark-x: -47px; --spark-y: -30px; }
    .spark-b { --spark-x: 44px; --spark-y: -35px; animation-delay: 180ms; }
    .spark-c { --spark-x: -53px; --spark-y: 20px; animation-delay: 220ms; }
    .spark-d { --spark-x: 53px; --spark-y: 18px; animation-delay: 260ms; }
    .spark-e { --spark-x: 0px; --spark-y: -45px; animation-delay: 300ms; }
    .hug-hearts { position: absolute; bottom: 14px; left: 50%; color: #a65462; font-size: 1rem; }
    .hug-heart { position: absolute; left: 0; bottom: 0; opacity: 0; }
    .hug-heart-a { --hug-x: -42px; --hug-y: -34px; }
    .hug-heart-b { --hug-x: -22px; --hug-y: -46px; }
    .hug-heart-c { --hug-x: 0px; --hug-y: -38px; }
    .hug-heart-d { --hug-x: 22px; --hug-y: -46px; }
    .hug-heart-e { --hug-x: 42px; --hug-y: -34px; }
    .is-hugged .hug-heart { animation: hug-heart-float 720ms ease-out both; }
    .stamp-hint { max-width: 430px; margin: 0; color: var(--text-muted); font-size: .75rem; line-height: 1.6; text-align: center; }
    .letter-copy { width: 100%; padding: 1.2rem 1.3rem; border: 1px solid #e7d6c7; border-radius: 12px; background: linear-gradient(145deg, #fffdf9, #f8efe4); font-family: var(--font-display); font-size: .96rem; line-height: 1.75; }
    .letter-copy p { margin: 0 0 .9rem; }
    .letter-copy p:last-child { margin-bottom: 0; }
    .letter-greeting, .letter-signoff { color: var(--wine); }
    .letter-greeting { font-size: 1.1rem; }
    .final-line { margin: 0; color: #7e394a; font-family: var(--font-display); font-size: 1.25rem; line-height: 1.4; text-align: center; }
    .final-actions { display: grid; justify-items: center; gap: .8rem; width: 100%; }
    button, a { font: 600 .75rem var(--font-body); }
    button { cursor: pointer; }
    .primary-action { min-height: 48px; padding: .65rem 1rem; border: 1px solid #713648; border-radius: 999px; background: #713648; color: #fffdf9; }
    .primary-action:focus-visible, .action-links button:focus-visible, .action-links a:focus-visible { outline: 3px solid var(--champagne); outline-offset: 2px; }
    .action-links { display: flex; flex-wrap: wrap; justify-content: center; gap: .45rem; }
    .action-links button, .action-links a { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: .55rem .75rem; border: 1px solid var(--border-strong); border-radius: 999px; background: #fffaf4; color: var(--wine); text-decoration: none; }
    @keyframes gift-box-appear { from { opacity: 0; transform: translateY(9px) scale(.78); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes gift-lid-open { from { transform: rotate(0); } to { transform: translate(-9px, -9px) rotate(-24deg); } }
    @keyframes gift-bow-lift { from { transform: rotate(-20deg); } to { transform: translate(-6px, -11px) rotate(-34deg); } }
    @keyframes gift-spark-burst { 0% { opacity: 0; transform: translate(-50%, -50%) translate(var(--spark-x), var(--spark-y)) scale(.25); } 32% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -50%) scale(.15); } }
    @keyframes hug-heart-float { 0% { opacity: 0; transform: translate(0, 0) scale(.5); } 35% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--hug-x), var(--hug-y)) scale(.9); } }
    @media (prefers-reduced-motion: reduce) {
      .final-gift *, .final-gift *::before, .final-gift *::after { animation: none !important; transition: none !important; }
      .final-gift.is-hugged .hug-heart { opacity: 1; transform: translate(var(--hug-x), var(--hug-y)); }
    }
    .is-reduced-motion *, .is-reduced-motion *::before, .is-reduced-motion *::after { animation: none !important; transition: none !important; }
    .is-reduced-motion.is-hugged .hug-heart { opacity: 1; transform: translate(var(--hug-x), var(--hug-y)); }
  `]
})
export class FinalGiftComponent {
  @Input() stampCount = 0;
  @Input() reducedMotion = false;
  @Output() readonly replay = new EventEmitter<void>();
  @Output() readonly returnHome = new EventEmitter<void>();
  @Output() readonly hugReceived = new EventEmitter<void>();
  protected readonly finalParagraphs = FINAL_LETTER.split('\n\n');
  protected hugged = false;

  protected hug(): void {
    this.hugged = true;
    this.hugReceived.emit();
  }
}
