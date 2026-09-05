import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BIRTHDAY_LETTER } from '../../core/constants/birthday.config';
import type { BirthdayStage, IntroPhoto } from '../../core/models/birthday.model';
import { BirthdayJourneyService } from '../../core/services/birthday-journey.service';
import { MemoryService } from '../../core/services/memory.service';
import { BirthdayCelebrationComponent } from './components/birthday-celebration/birthday-celebration.component';
import { GiftRevealComponent } from './components/gift-reveal/gift-reveal.component';

@Component({
  selector: 'app-birthday-experience',
  standalone: true,
  imports: [BirthdayCelebrationComponent, GiftRevealComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="birthday-experience" [attr.data-stage]="stage()">
      @switch (stage()) {
        @case ('celebration') {
          <app-birthday-celebration [photos]="celebrationPhotos" (proceed)="enterGift()" />
        }

        @case ('gift') {
          <app-gift-reveal (proceed)="enterEnvelope()" />
        }

        @case ('envelope') {
          <div class="envelope-stage stage-shell" aria-labelledby="birthday-title">
            <div class="envelope-copy">
              <p class="kicker">Món quà 02 · Một phong thư nhỏ</p>
              <h1 id="birthday-title">Gửi người phụ nữ<br>của đời anh.</h1>
              <p>Ngày 05.09.2026. Tuổi 22 của em. Và một vài điều anh muốn tự tay đặt vào đây.</p>
            </div>
            <button class="envelope-button" type="button" (click)="openLetter()" aria-label="Mở phong thư">
              <span class="envelope-paper"></span>
              <span class="envelope-flap"></span>
              <span class="envelope-fold fold-left"></span>
              <span class="envelope-fold fold-right"></span>
              <span class="wax-seal">H<span>♡</span>Q</span>
            </button>
            <button class="quiet-action dark-action" type="button" (click)="goToTimeline()">Đi thẳng tới những kỷ niệm</button>
            <p class="stage-index dark-index" aria-hidden="true">02 <i></i> 03</p>
          </div>
        }

        @case ('letter') {
          <div class="letter-stage stage-shell">
            <div class="letter-layout">
              <aside aria-hidden="true">
                <span>H</span><i></i><span>Q</span>
                <small>05 · 09 · 2026</small>
              </aside>
              <article class="love-letter" aria-labelledby="birthday-title" tabindex="-1">
                <header>
                  <p class="kicker">Happy 22nd Birthday, My Love</p>
                  <h1 id="birthday-title">Cho Quỳnh,<br>người anh thương.</h1>
                  <div class="letter-rule" aria-hidden="true"><i></i><span>♡</span><i></i></div>
                </header>
                <div class="letter-body">
                  @for (block of letter; track $index) {
                    <p [class]="'letter-' + block.kind">{{ block.text }}</p>
                  }
                </div>
                <footer>
                  <div class="story-prelude">
                    <span>04 · 01 · 2026</span>
                    <p>Trước khi em bước sang một tuổi mới, mình cùng đi lại những ngày đã đưa chúng mình đến đây nhé.</p>
                  </div>
                  <button class="primary-action paper-action" type="button" (click)="goToTimeline()">Đi cùng anh nhé <span aria-hidden="true">↘</span></button>
                </footer>
              </article>
            </div>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    :host { display:block; }
    .birthday-experience,.stage-shell { min-height:100dvh; }
    .stage-shell { position:relative; isolation:isolate; display:grid; overflow:hidden; }
    .kicker { margin:0; color:var(--wine); font-size:.68rem; font-weight:600; letter-spacing:.17em; text-transform:uppercase; }
    h1 { margin:0; font-family:var(--font-display); font-size:clamp(3.1rem,8vw,7.5rem); font-weight:400; letter-spacing:-.07em; line-height:.85; }
    .primary-action { display:inline-flex; align-items:center; justify-content:center; gap:.75rem; min-height:50px; padding:.82rem 1.1rem; border:1px solid transparent; background:#fffdf9; color:var(--button); cursor:pointer; font-size:.72rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase; transition:transform 180ms var(--ease-out),background 180ms var(--ease-out); }
    .primary-action:hover { transform:translateY(-2px); background:#fff; }
    .quiet-action { min-height:44px; border:0; background:transparent; color:inherit; cursor:pointer; font-size:.74rem; text-decoration:underline; text-underline-offset:.3rem; }
    .stage-index { position:absolute; right:clamp(1.25rem,4vw,3rem); bottom:2rem; display:flex; align-items:center; gap:.7rem; font-size:.66rem; letter-spacing:.15em; }
    .stage-index i { width:2rem; height:1px; background:currentColor; opacity:.5; }
    .envelope-stage { align-content:center; justify-items:center; gap:2rem; padding:3rem 1.2rem; background:linear-gradient(145deg,#f6e9df,#ead5c8); color:var(--ink); text-align:center; }
    .envelope-stage::before { position:absolute; inset:1rem; z-index:-1; border:1px solid rgba(127,59,75,.14); content:''; }
    .envelope-copy { display:grid; justify-items:center; gap:1rem; max-width:720px; }
    .envelope-copy p:last-child { max-width:440px; margin:0; color:var(--text-secondary); font-family:var(--font-display); line-height:1.7; }
    .envelope-button { position:relative; width:min(78vw,430px); aspect-ratio:1.55; border:0; background:transparent; cursor:pointer; filter:drop-shadow(0 24px 18px rgba(87,45,49,.17)); transition:transform 220ms var(--ease-out); }
    .envelope-button:hover { transform:translateY(-5px); }
    .envelope-paper,.envelope-flap,.envelope-fold { position:absolute; inset:0; display:block; }
    .envelope-paper { border:1px solid rgba(108,51,65,.16); background:#fffaf2; }
    .envelope-flap { z-index:3; height:71%; background:#efd9cd; clip-path:polygon(0 0,100% 0,50% 100%); }
    .envelope-fold { top:auto; z-index:2; width:72%; height:72%; background:#e7c7b9; }
    .fold-left { left:0; clip-path:polygon(0 0,100% 100%,0 100%); }
    .fold-right { right:0; clip-path:polygon(100% 0,100% 100%,0 100%); background:#e1bcae; }
    .wax-seal { position:absolute; top:45%; left:50%; z-index:4; display:grid; place-items:center; width:4.2rem; height:4.2rem; border:2px solid rgba(255,255,255,.38); border-radius:50%; background:var(--button); color:#fffaf2; font-family:var(--font-display); transform:translate(-50%,-50%) rotate(-7deg); box-shadow:inset 0 0 0 3px rgba(255,255,255,.08); }
    .wax-seal span { font-size:.65rem; }
    .dark-action,.dark-index { color:var(--text-muted); }
    .letter-stage { padding:clamp(2rem,5vw,5rem) 1rem; background:linear-gradient(135deg,#f1e4d7,#f8f4ee); color:var(--ink); }
    .letter-layout { display:grid; grid-template-columns:72px minmax(0,800px); gap:clamp(1rem,3vw,2.5rem); width:min(100%,980px); margin:auto; }
    aside { display:grid; align-content:start; justify-items:center; gap:.65rem; padding-top:1rem; color:var(--wine); font-family:var(--font-display); font-size:1.35rem; }
    aside i { width:1px; height:4rem; background:var(--champagne); }
    aside small { margin-top:.4rem; color:var(--text-muted); font-family:var(--font-body); font-size:.61rem; letter-spacing:.12em; writing-mode:vertical-rl; }
    .love-letter { position:relative; padding:clamp(2rem,7vw,6rem); border:1px solid rgba(127,59,75,.18); background:var(--surface); box-shadow:var(--shadow-soft); }
    .love-letter::before { position:absolute; inset:.65rem; border:1px solid rgba(216,181,122,.3); content:''; pointer-events:none; }
    .love-letter header,.letter-body,.love-letter footer { position:relative; z-index:1; }
    .love-letter header { text-align:center; }
    .love-letter h1 { margin-top:.8rem; font-size:clamp(2.8rem,6vw,5.7rem); }
    .letter-rule { display:flex; align-items:center; gap:.8rem; width:min(100%,230px); margin:1.7rem auto 3rem; color:var(--wine); }
    .letter-rule i { flex:1; height:1px; background:var(--champagne); }
    .letter-body { color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(1.06rem,1.8vw,1.22rem); line-height:1.9; }
    .letter-body p { margin:0 0 1.25em; }
    .letter-salutation { color:var(--wine); font-size:1.28em; }
    .letter-emphasis { margin-left:.3rem!important; padding-left:1rem; border-left:2px solid var(--champagne); color:var(--wine); line-height:1.55; }
    .letter-signature { margin-top:2.4rem!important; color:var(--wine); text-align:right; }
    .love-letter footer { display:grid; justify-items:center; gap:1rem; margin-top:3rem; padding-top:2rem; border-top:1px solid var(--border); text-align:center; }
    .story-prelude { max-width:560px; }
    .story-prelude span { color:var(--wine); font-size:.65rem; font-weight:600; letter-spacing:.15em; }
    .story-prelude p { margin:.65rem 0 0; color:var(--text-secondary); font-family:var(--font-display); font-size:1.05rem; line-height:1.65; }
    .paper-action { border-color:var(--button); background:var(--button); color:#fffdf9; }
    .paper-action:hover { background:var(--wine); }
    @media (max-width:640px) { .letter-layout { display:block; } aside { display:flex; justify-content:center; margin-bottom:1rem; padding:0; } aside i { width:3rem; height:1px; } aside small { display:none; } .love-letter { padding:2rem 1.3rem 2.7rem; } .letter-body { font-size:1.04rem; line-height:1.8; } .letter-signature { text-align:left; } }
  `]
})
export class BirthdayExperienceComponent implements AfterViewInit, OnDestroy, OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly journey = inject(BirthdayJourneyService);
  private readonly router = inject(Router);
  private readonly memoryService = inject(MemoryService);

  protected readonly stage = signal<BirthdayStage>('celebration');
  protected readonly letter = BIRTHDAY_LETTER;
  protected readonly celebrationPhotos: readonly IntroPhoto[] = this.memoryService.getIntroPhotos();

  ngOnInit(): void { this.journey.start(); }
  ngAfterViewInit(): void { queueMicrotask(() => this.focus('button')); }
  ngOnDestroy(): void { this.journey.stop(); }

  @HostListener('document:keydown.escape')
  protected skip(): void {
    if (this.stage() === 'celebration') { this.enterGift(); return; }
    if (this.stage() === 'gift') { this.enterEnvelope(); return; }
    this.goToTimeline();
  }

  protected enterGift(): void { this.stage.set('gift'); queueMicrotask(() => this.focus('.gift')); }
  protected enterEnvelope(): void { this.stage.set('envelope'); queueMicrotask(() => this.focus('.envelope-button')); }
  protected openLetter(): void { this.stage.set('letter'); queueMicrotask(() => this.focus('.love-letter')); }

  protected goToTimeline(): void {
    this.journey.complete();
    void this.router.navigateByUrl('/timeline');
  }

  private focus(selector: string): void {
    (this.document.querySelector(selector) as HTMLElement | null)?.focus();
  }
}
