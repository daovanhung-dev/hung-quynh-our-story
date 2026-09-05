import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BIRTHDAY_LETTER } from '../../core/constants/birthday.config';
import type { BirthdayStage, IntroPhoto } from '../../core/models/birthday.model';
import { BirthdayJourneyService } from '../../core/services/birthday-journey.service';
import { MemoryService } from '../../core/services/memory.service';

@Component({
  selector: 'app-birthday-experience',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="birthday-experience" [attr.data-stage]="stage()" aria-labelledby="birthday-title">
      @switch (stage()) {
        @case ('prologue') {
          <div class="prologue stage-shell">
            <div class="prologue-glow" aria-hidden="true"></div>
            @if (introPhotos.length) {
              <div class="photo-triptych" aria-hidden="true">
                @for (photo of introPhotos; track photo.id; let index = $index) {
                  <img [class]="'memory memory-' + index" [src]="photo.src" [alt]="" [attr.fetchpriority]="index === 1 ? 'high' : null" decoding="async">
                }
              </div>
            }
            <div class="prologue-copy">
              <p class="kicker">Hùng ♡ Quỳnh</p>
              <p class="overline">Một lời nhắn cho người anh yêu</p>
              <h1 id="birthday-title">Có một điều nhỏ<br>anh muốn gửi đến em.</h1>
              <p class="lede">Đi chậm một chút nhé, mình cùng mở lại những ngày đã có nhau.</p>
              <button class="primary-action" type="button" (click)="next()">Mở lời nhắn <span aria-hidden="true">↘</span></button>
              <button class="quiet-action" type="button" (click)="skip()">Đi tới dòng thời gian</button>
            </div>
            <p class="stage-index" aria-hidden="true">01 <i></i> 03</p>
          </div>
        }

        @case ('envelope') {
          <div class="envelope-stage stage-shell">
            <div class="envelope-copy">
              <p class="kicker">Một phong thư nhỏ</p>
              <h1 id="birthday-title">Gửi cô gái<br>của anh.</h1>
              <p>Không cần vội. Chỉ cần chạm vào phong thư này khi em đã sẵn sàng.</p>
            </div>
            <button class="envelope-button" type="button" (click)="next()" aria-label="Mở phong thư">
              <span class="envelope-paper"></span>
              <span class="envelope-flap"></span>
              <span class="envelope-fold fold-left"></span>
              <span class="envelope-fold fold-right"></span>
              <span class="wax-seal">H<span>♡</span>Q</span>
            </button>
            <button class="quiet-action dark-action" type="button" (click)="skip()">Bỏ qua lời nhắn</button>
            <p class="stage-index dark-index" aria-hidden="true">02 <i></i> 03</p>
          </div>
        }

        @case ('letter') {
          <div class="letter-stage stage-shell">
            <div class="letter-layout">
              <aside aria-hidden="true">
                <span>H</span><i></i><span>Q</span>
                <small>03 / 03</small>
              </aside>
              <article class="love-letter" aria-labelledby="birthday-title" tabindex="-1">
                <header>
                  <p class="kicker">Happy birthday, my love</p>
                  <h1 id="birthday-title">Cho em,<br>người anh thương.</h1>
                  <div class="letter-rule" aria-hidden="true"><i></i><span>♡</span><i></i></div>
                </header>
                <div class="letter-body">
                  @for (block of letter; track $index) {
                    <p [class]="'letter-' + block.kind">{{ block.text }}</p>
                  }
                </div>
                <footer>
                  <p>Những ngày đẹp nhất luôn đáng được giữ lại.</p>
                  <button class="primary-action paper-action" type="button" (click)="goToTimeline()">Mở những kỷ niệm <span aria-hidden="true">↘</span></button>
                  <button class="quiet-action" type="button" (click)="skip()">Đi tới dòng thời gian</button>
                </footer>
              </article>
            </div>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .birthday-experience, .stage-shell { min-height: 100dvh; }
    .stage-shell { position: relative; isolation: isolate; display: grid; overflow: hidden; }
    .kicker, .overline { margin: 0; font-size: .69rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
    h1 { margin: 0; font-family: var(--font-display); font-size: clamp(3.3rem, 9vw, 8rem); font-weight: 400; letter-spacing: -.07em; line-height: .84; }
    .primary-action { display: inline-flex; align-items: center; justify-content: center; gap: .75rem; min-height: 48px; padding: .78rem 1.1rem; border: 1px solid transparent; border-radius: 0; background: #fffdf9; color: var(--button); cursor: pointer; font-size: .74rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; transition: transform 180ms var(--ease-out), background 180ms var(--ease-out); }
    .primary-action:hover { transform: translateY(-2px); background: #fff; }
    .primary-action span { font-size: 1.1rem; }
    .quiet-action { min-height: 44px; border: 0; background: transparent; color: inherit; cursor: pointer; font-size: .75rem; text-decoration: underline; text-underline-offset: .3rem; }
    .stage-index { position: absolute; right: clamp(1.25rem, 4vw, 3rem); bottom: 2rem; display: flex; align-items: center; gap: .7rem; font-size: .66rem; letter-spacing: .15em; }
    .stage-index i { display: block; width: 2rem; height: 1px; background: currentColor; opacity: .5; }

    .prologue { place-items: center; padding: clamp(2rem, 5vw, 4rem); background: #25171b; color: #fffdf9; }
    .prologue::before { position: absolute; inset: 1rem; z-index: -1; border: 1px solid rgba(216,181,122,.27); content: ''; }
    .prologue-glow { position: absolute; inset: 0; z-index: -1; background: radial-gradient(circle at 50% 30%, rgba(166,84,98,.3), transparent 34%), radial-gradient(circle at 80% 90%, rgba(216,181,122,.16), transparent 25%); }
    .prologue-copy { display: grid; justify-items: center; max-width: 720px; text-align: center; }
    .prologue-copy .kicker { color: var(--champagne); }
    .overline { margin-top: 2.1rem; color: rgba(255,253,249,.65); }
    .prologue-copy h1 { margin-top: .9rem; }
    .lede { max-width: 410px; margin: 1.5rem 0 2rem; color: rgba(255,253,249,.74); font-family: var(--font-display); font-size: clamp(1.05rem, 2vw, 1.3rem); line-height: 1.6; }
    .prologue .quiet-action { margin-top: .7rem; color: rgba(255,253,249,.66); }
    .photo-triptych { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
    .memory { position: absolute; width: clamp(7rem, 16vw, 13rem); aspect-ratio: 4 / 5; object-fit: cover; opacity: .24; box-shadow: 0 20px 50px rgba(0,0,0,.2); animation: memory-in 620ms var(--ease-out) both; }
    .memory-0 { top: 11%; left: 7%; transform: rotate(-8deg); }
    .memory-1 { right: 8%; bottom: 10%; transform: rotate(7deg); animation-delay: 120ms; }
    .memory-2 { top: 17%; right: 18%; width: clamp(5.5rem, 12vw, 10rem); transform: rotate(-3deg); animation-delay: 220ms; }
    @keyframes memory-in { from { opacity: 0; transform: translateY(12px) rotate(var(--rotation, 0deg)); } to { opacity: .24; } }

    .envelope-stage { align-content: center; justify-items: center; gap: 2rem; padding: 2rem; background: linear-gradient(145deg, #f6e9df, #ead5c8); color: var(--ink); text-align: center; }
    .envelope-stage::before { position: absolute; inset: 7%; border: 1px solid rgba(127,59,75,.14); content: ''; pointer-events: none; }
    .envelope-copy { display: grid; justify-items: center; gap: 1rem; max-width: 620px; }
    .envelope-copy .kicker { color: var(--wine); }
    .envelope-copy p:last-child { max-width: 420px; margin: 0; color: var(--text-secondary); line-height: 1.7; }
    .envelope-button { position: relative; width: min(78vw, 430px); aspect-ratio: 1.55; border: 0; background: transparent; cursor: pointer; filter: drop-shadow(0 24px 18px rgba(87,45,49,.17)); transition: transform 220ms var(--ease-out); }
    .envelope-button:hover { transform: translateY(-5px); }
    .envelope-paper, .envelope-flap, .envelope-fold { position: absolute; inset: 0; display: block; }
    .envelope-paper { border: 1px solid rgba(108,51,65,.16); background: #fffaf2; }
    .envelope-flap { z-index: 3; height: 71%; background: #efd9cd; clip-path: polygon(0 0,100% 0,50% 100%); }
    .envelope-fold { top: auto; z-index: 2; width: 72%; height: 72%; background: #e7c7b9; }
    .fold-left { left: 0; clip-path: polygon(0 0,100% 100%,0 100%); }
    .fold-right { right: 0; clip-path: polygon(100% 0,100% 100%,0 100%); background: #e1bcae; }
    .wax-seal { position: absolute; top: 45%; left: 50%; z-index: 4; display: grid; place-items: center; width: 4rem; height: 4rem; border: 2px solid rgba(255,255,255,.38); border-radius: 50%; background: var(--button); color: #fffaf2; font-family: var(--font-display); transform: translate(-50%,-50%) rotate(-7deg); box-shadow: inset 0 0 0 3px rgba(255,255,255,.08); }
    .wax-seal span { font-size: .65rem; }
    .dark-action, .dark-index { color: var(--text-muted); }

    .letter-stage { padding: clamp(2rem, 5vw, 5rem) 1rem; background: linear-gradient(135deg, #f1e4d7, #f8f4ee); color: var(--ink); }
    .letter-layout { display: grid; grid-template-columns: 72px minmax(0, 800px); gap: clamp(1rem, 3vw, 2.5rem); width: min(100%, 980px); margin: auto; }
    aside { display: grid; align-content: start; justify-items: center; gap: .65rem; padding-top: 1rem; color: var(--wine); font-family: var(--font-display); font-size: 1.35rem; }
    aside i { width: 1px; height: 4rem; background: var(--champagne); }
    aside small { margin-top: .4rem; color: var(--text-muted); font-family: var(--font-body); font-size: .63rem; letter-spacing: .12em; writing-mode: vertical-rl; }
    .love-letter { position: relative; padding: clamp(2rem, 7vw, 6rem); border: 1px solid rgba(127,59,75,.18); background: var(--surface); box-shadow: var(--shadow-soft); }
    .love-letter::before { position: absolute; inset: .65rem; border: 1px solid rgba(216,181,122,.3); content: ''; pointer-events: none; }
    .love-letter header, .letter-body, .love-letter footer { position: relative; z-index: 1; }
    .love-letter header { text-align: center; }
    .love-letter header .kicker { color: var(--wine); }
    .love-letter h1 { margin-top: .75rem; font-size: clamp(2.8rem, 6vw, 5.7rem); }
    .letter-rule { display: flex; align-items: center; gap: .8rem; width: min(100%, 230px); margin: 1.7rem auto 3rem; color: var(--wine); }
    .letter-rule i { flex: 1; height: 1px; background: var(--champagne); }
    .letter-body { color: var(--text-secondary); font-family: var(--font-display); font-size: clamp(1.08rem, 1.8vw, 1.22rem); line-height: 1.9; }
    .letter-body p { margin: 0 0 1.25em; }
    .letter-salutation { color: var(--wine); font-size: 1.25em; }
    .letter-emphasis { margin-left: .3rem !important; padding-left: 1rem; border-left: 2px solid var(--champagne); color: var(--wine); line-height: 1.55; }
    .letter-signature { margin-top: 2.3rem !important; color: var(--wine); text-align: right; }
    .love-letter footer { display: grid; justify-items: center; gap: .85rem; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border); text-align: center; }
    .love-letter footer p { margin: 0; color: var(--text-muted); font-size: .78rem; }
    .paper-action { border-color: var(--button); background: var(--button); color: #fffdf9; }
    .paper-action:hover { background: var(--wine); }
    @media (max-width: 640px) {
      .prologue { padding-inline: 1.2rem; }
      .memory-2 { display: none; }
      .letter-layout { display: block; }
      aside { display: flex; justify-content: center; margin-bottom: 1rem; padding: 0; }
      aside i { width: 3rem; height: 1px; }
      aside small { display: none; }
      .love-letter { padding: 2rem 1.3rem 2.7rem; }
      .letter-body { font-size: 1.05rem; line-height: 1.8; }
      .letter-signature { text-align: left; }
    }
    @media (prefers-reduced-motion: reduce) { .memory { animation: none; } }
  `]
})
export class BirthdayExperienceComponent implements AfterViewInit, OnDestroy, OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly journey = inject(BirthdayJourneyService);
  private readonly router = inject(Router);
  private readonly memoryService = inject(MemoryService);

  protected readonly stage = signal<BirthdayStage>('prologue');
  protected readonly letter = BIRTHDAY_LETTER;
  protected readonly introPhotos = this.pickIntroPhotos(this.memoryService.getIntroPhotos());

  ngOnInit(): void {
    this.journey.start();
  }

  ngAfterViewInit(): void {
    this.focus('.primary-action');
  }

  ngOnDestroy(): void {
    this.journey.stop();
  }

  @HostListener('document:keydown.escape')
  protected skip(): void {
    this.goToTimeline();
  }

  protected next(): void {
    if (this.stage() === 'prologue') {
      this.stage.set('envelope');
      queueMicrotask(() => this.focus('.envelope-button'));
      return;
    }
    if (this.stage() === 'envelope') {
      this.stage.set('letter');
      queueMicrotask(() => this.focus('.love-letter'));
    }
  }

  protected goToTimeline(): void {
    this.journey.complete();
    void this.router.navigateByUrl('/timeline');
  }

  private pickIntroPhotos(photos: readonly IntroPhoto[]): readonly IntroPhoto[] {
    if (photos.length <= 3) return photos;
    return [photos[0], photos[Math.floor(photos.length / 2)], photos[photos.length - 1]];
  }

  private focus(selector: string): void {
    (this.document.querySelector(selector) as HTMLElement | null)?.focus();
  }
}
