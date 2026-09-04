import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { BIRTHDAY_LETTER } from '../../core/constants/birthday.config';
import type { BirthdayLetterBlock, BirthdayStage, IntroPhoto } from '../../core/models/birthday.model';
import { BirthdayJourneyService } from '../../core/services/birthday-journey.service';
import { MemoryService } from '../../core/services/memory.service';

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  hue: number;
  decay: number;
}

interface IntroFrame extends IntroPhoto {
  key: string;
  top: string;
  delay: string;
  duration: string;
  rotation: string;
}

@Component({
  selector: 'app-birthday-experience',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (stage() === 'fireworks') {
      <section class="birthday-stage fireworks-stage" role="dialog" aria-modal="true" aria-labelledby="birthday-title">
        <div class="photo-stream" aria-hidden="true">
          @for (photo of visiblePhotos(); track photo.key) {
            <figure
              class="floating-photo"
              [style.--photo-top]="photo.top"
              [style.--photo-delay]="photo.delay"
              [style.--photo-duration]="photo.duration"
              [style.--photo-rotation]="photo.rotation"
            >
              <img [src]="photo.src" [alt]="photo.alt || ''" loading="lazy" decoding="async">
            </figure>
          }
        </div>

        <canvas #fireworksCanvas class="fireworks-canvas" aria-hidden="true"></canvas>
        <div class="fireworks-veil" aria-hidden="true"></div>

        <div class="birthday-content">
          <p class="stage-mark">Hùng ♡ Quỳnh · a little celebration</p>
          <h1 id="birthday-title" aria-label="happy birthday Hung's Love">
            <span>happy birthday</span>
            <strong>Hung's Love</strong>
          </h1>
          <p class="birthday-intro">Một điều nhỏ anh đã chuẩn bị riêng cho em.</p>
        </div>

        <div class="stage-actions">
          <button class="primary-action" type="button" (click)="next()">
            Mở lá thư của anh
            <span aria-hidden="true">↗</span>
          </button>
          <button class="quiet-action light-action" type="button" (click)="skip()">Bỏ qua đến những kỷ niệm</button>
        </div>

        <p class="stage-index" aria-hidden="true"><span>01</span><i></i><span>03</span></p>
      </section>
    } @else if (stage() === 'envelope') {
      <section class="birthday-stage envelope-stage" role="dialog" aria-modal="true" aria-labelledby="envelope-title">
        <div class="paper-aura" aria-hidden="true"></div>
        <div class="envelope-content">
          <p class="stage-mark dark-mark">A letter for you · 02 / 03</p>
          <h1 id="envelope-title">Có một điều anh muốn nói với em.</h1>
          <p class="stage-description">Một lá thư nhỏ, dành cho người con gái anh yêu thương nhất.</p>

          <button class="envelope-button" type="button" aria-label="Chạm để mở phong thư tình" (click)="next()">
            <span class="envelope-shape" aria-hidden="true">
              <span class="envelope-paper"></span>
              <span class="envelope-flap"></span>
              <span class="envelope-fold envelope-fold-left"></span>
              <span class="envelope-fold envelope-fold-right"></span>
              <span class="wax-seal">H<span>♡</span>Q</span>
            </span>
            <span class="envelope-hint">Chạm vào để mở</span>
          </button>

          <button class="quiet-action dark-action" type="button" (click)="skip()">Bỏ qua đến những kỷ niệm</button>
        </div>
      </section>
    } @else {
      <section class="birthday-stage letter-stage" role="dialog" aria-modal="true" aria-labelledby="letter-title">
        <div class="letter-layout">
          <aside class="letter-aside" aria-label="Thông tin lá thư">
            <span class="aside-stamp">H ♡ Q</span>
            <span class="aside-label">Birthday letter</span>
            <span class="aside-number">03<br>of<br>03</span>
          </aside>

          <article class="love-letter">
            <header class="letter-header">
              <p class="stage-mark dark-mark">Hùng ♡ Quỳnh · viết cho em</p>
              <h1 id="letter-title" tabindex="-1">Một lá thư dành cho em</h1>
              <div class="letter-rule" aria-hidden="true"><span>♡</span></div>
            </header>

            <div class="letter-body">
              @for (block of letter; track $index) {
                @switch (block.kind) {
                  @case ('salutation') {
                    <p class="letter-salutation"><strong>{{ block.text }}</strong></p>
                  }
                  @case ('emphasis') {
                    <p class="letter-emphasis"><strong>{{ block.text }}</strong></p>
                  }
                  @case ('signature') {
                    <p class="letter-signature"><strong>{{ block.text }}</strong></p>
                  }
                  @default {
                    <p>{{ block.text }}</p>
                  }
                }
              }
            </div>

            <footer class="letter-footer">
              <p>Thư đã mở. Những ngày của chúng mình vẫn còn ở phía trước.</p>
              <button class="primary-action paper-action" type="button" (click)="goToTimeline()">
                Đi tới những kỷ niệm của chúng mình
                <span aria-hidden="true">↗</span>
              </button>
            </footer>
          </article>
        </div>

        <button class="letter-skip" type="button" (click)="skip()">Bỏ qua thư · đi tới timeline</button>
      </section>
    }
  `,
  styles: [`
    :host { display: block; }

    .birthday-stage {
      position: fixed;
      inset: 0;
      z-index: 100;
      min-height: 100dvh;
      overflow: hidden;
      isolation: isolate;
    }

    .fireworks-stage {
      display: grid;
      place-items: center;
      padding: clamp(1.25rem, 4vw, 3rem);
      background:
        radial-gradient(circle at 50% 45%, rgba(111, 35, 70, .22), transparent 35%),
        radial-gradient(circle at 15% 85%, rgba(48, 47, 116, .18), transparent 32%),
        #050507;
      color: #fff;
    }

    .fireworks-canvas,
    .fireworks-veil,
    .photo-stream {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .photo-stream {
      z-index: 0;
      overflow: hidden;
      opacity: .52;
      mask-image: linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
    }

    .floating-photo {
      position: absolute;
      top: var(--photo-top);
      left: 0;
      width: clamp(7.5rem, 14vw, 13rem);
      aspect-ratio: 4 / 5;
      margin: 0;
      padding: .35rem;
      border: 1px solid rgba(255, 225, 196, .2);
      border-radius: 1.15rem;
      background: rgba(255, 243, 231, .08);
      box-shadow: 0 18px 60px rgba(0, 0, 0, .3);
      transform: translateX(-24vw) rotate(var(--photo-rotation));
      animation: photo-drift var(--photo-duration) var(--photo-delay) linear both;
      will-change: transform;
    }

    .floating-photo img {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: .85rem;
      object-fit: cover;
      filter: saturate(.78) brightness(.7) contrast(1.05);
    }

    .fireworks-canvas { z-index: 1; pointer-events: none; }
    .fireworks-veil {
      z-index: 2;
      pointer-events: none;
      background: radial-gradient(ellipse at center, transparent 15%, rgba(5, 5, 7, .38) 72%, rgba(5, 5, 7, .92) 100%);
    }

    .birthday-content,
    .stage-actions,
    .stage-index {
      position: relative;
      z-index: 3;
    }

    .birthday-content {
      width: min(760px, 100%);
      margin-top: -5rem;
      text-align: center;
    }

    .stage-mark {
      margin: 0 0 1.1rem;
      color: rgba(255, 239, 222, .72);
      font-size: .7rem;
      font-weight: 800;
      letter-spacing: .22em;
      text-transform: uppercase;
    }

    .dark-mark { color: var(--accent-deep); }

    .birthday-content h1 {
      display: grid;
      gap: .12em;
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(3.8rem, 12vw, 9rem);
      font-weight: 400;
      letter-spacing: -.07em;
      line-height: .82;
      text-shadow: 0 10px 50px rgba(255, 115, 132, .18);
    }

    .birthday-content h1 span {
      color: #f7c8a4;
      font-family: var(--font-body);
      font-size: .16em;
      font-weight: 700;
      letter-spacing: .38em;
      line-height: 1;
      text-transform: uppercase;
    }

    .birthday-content h1 strong { font-weight: 400; }
    .birthday-intro { margin: 1.5rem 0 0; color: rgba(255,255,255,.67); font-size: .96rem; letter-spacing: .03em; }

    .stage-actions {
      position: absolute;
      bottom: clamp(2.3rem, 8vh, 5rem);
      display: grid;
      justify-items: center;
      gap: .8rem;
    }

    .primary-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: .8rem;
      min-height: 3.1rem;
      padding: .8rem 1.15rem .8rem 1.35rem;
      border: 1px solid rgba(255, 219, 190, .28);
      border-radius: 999px;
      background: linear-gradient(135deg, #f4c19d, #c97880);
      color: #2b171b;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 16px 36px rgba(205, 101, 119, .22);
      transition: transform 240ms var(--ease-soft), box-shadow 240ms var(--ease-soft), filter 240ms var(--ease-soft);
    }

    .primary-action span { font-size: 1.15em; transition: transform 240ms var(--ease-soft); }
    .primary-action:hover { filter: brightness(1.05); transform: translateY(-2px); box-shadow: 0 20px 44px rgba(205, 101, 119, .3); }
    .primary-action:hover span { transform: translate(2px, -2px); }

    .quiet-action,
    .letter-skip {
      border: 0;
      background: transparent;
      cursor: pointer;
      font-size: .78rem;
      letter-spacing: .02em;
      text-decoration: underline;
      text-underline-offset: .25rem;
    }

    .light-action { color: rgba(255,255,255,.58); }
    .light-action:hover { color: #fff; }
    .stage-index {
      position: absolute;
      right: clamp(1.25rem, 4vw, 3rem);
      bottom: clamp(2.3rem, 8vh, 5rem);
      display: flex;
      align-items: center;
      gap: .65rem;
      color: rgba(255,255,255,.5);
      font-size: .68rem;
      letter-spacing: .18em;
    }
    .stage-index i { display: block; width: 2rem; height: 1px; background: rgba(255,255,255,.35); }

    .envelope-stage {
      display: grid;
      place-items: center;
      overflow-y: auto;
      padding: 2rem 1rem;
      background:
        radial-gradient(circle at 50% 12%, rgba(255, 255, 255, .9), transparent 28%),
        linear-gradient(145deg, #f9ede3 0%, #f1d9ca 52%, #e5c2b8 100%);
      color: var(--text-primary);
    }

    .paper-aura {
      position: absolute;
      inset: 8% 12%;
      border: 1px solid rgba(143, 81, 93, .1);
      border-radius: 50%;
      box-shadow: 0 0 0 28px rgba(255,255,255,.08), 0 0 0 56px rgba(255,255,255,.04);
      pointer-events: none;
    }

    .envelope-content { position: relative; z-index: 1; display: grid; justify-items: center; width: min(700px, 100%); text-align: center; }
    .envelope-content h1 { max-width: 620px; margin: 0; font-family: var(--font-display); font-size: clamp(2.8rem, 7vw, 6rem); font-weight: 400; letter-spacing: -.06em; line-height: .9; }
    .stage-description { max-width: 430px; margin: 1.15rem auto 0; color: var(--text-secondary); line-height: 1.7; }

    .envelope-button { display: grid; justify-items: center; gap: 1rem; margin: clamp(2.5rem, 7vh, 5rem) 0 1.7rem; border: 0; background: transparent; color: var(--text-primary); cursor: pointer; }
    .envelope-shape { position: relative; display: block; width: clamp(17rem, 46vw, 30rem); aspect-ratio: 1.55; filter: drop-shadow(0 24px 22px rgba(105, 55, 59, .2)); transition: transform 360ms var(--ease-soft), filter 360ms var(--ease-soft); }
    .envelope-button:hover .envelope-shape, .envelope-button:focus-visible .envelope-shape { transform: translateY(-8px) rotate(-1deg); filter: drop-shadow(0 32px 28px rgba(105, 55, 59, .26)); }
    .envelope-paper { position: absolute; inset: 0; z-index: 1; border: 1px solid rgba(112, 57, 64, .15); border-radius: .6rem; background: #fcf4ea; }
    .envelope-flap { position: absolute; top: 0; left: 0; z-index: 4; width: 100%; height: 72%; clip-path: polygon(0 0, 100% 0, 50% 100%); border: 1px solid rgba(112, 57, 64, .12); background: #f5dfd0; transform-origin: top center; }
    .envelope-fold { position: absolute; bottom: 0; z-index: 3; width: 72%; height: 72%; background: #efd3c4; }
    .envelope-fold-left { left: 0; clip-path: polygon(0 0, 100% 100%, 0 100%); }
    .envelope-fold-right { right: 0; clip-path: polygon(100% 0, 100% 100%, 0 100%); background: #e9c8bc; }
    .wax-seal { position: absolute; top: 43%; left: 50%; z-index: 6; display: grid; place-items: center; width: 4rem; height: 4rem; border: 3px solid #9a4f5b; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #cc7d84, #8f3f4d); color: #ffe8d8; font-family: var(--font-display); font-size: 1.1rem; line-height: .8; transform: translate(-50%, -50%) rotate(-8deg); box-shadow: inset 0 0 0 3px rgba(255,255,255,.12), 0 6px 12px rgba(97, 39, 48, .18); }
    .wax-seal span { font-size: .72rem; }
    .envelope-hint { color: var(--accent-deep); font-size: .8rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .dark-action { color: var(--text-muted); }
    .dark-action:hover { color: var(--accent-deep); }

    .letter-stage {
      overflow-y: auto;
      padding: clamp(2rem, 5vw, 4rem) 1rem 4rem;
      background:
        radial-gradient(circle at 8% 10%, rgba(185, 120, 130, .13), transparent 22%),
        radial-gradient(circle at 90% 84%, rgba(205, 164, 117, .13), transparent 24%),
        #f3e5d7;
      color: var(--text-primary);
    }

    .letter-layout { display: grid; grid-template-columns: 100px minmax(0, 820px); gap: 1.5rem; width: min(1060px, 100%); margin: 0 auto; align-items: start; }
    .letter-aside { position: sticky; top: 1rem; display: grid; justify-items: center; gap: 1rem; padding-top: 1rem; color: var(--accent-deep); text-align: center; }
    .aside-stamp { display: grid; place-items: center; width: 4.2rem; height: 4.2rem; border: 1px solid rgba(143,81,93,.45); border-radius: 50%; font-family: var(--font-display); font-size: 1.1rem; transform: rotate(-10deg); }
    .aside-label, .aside-number { color: var(--text-muted); font-size: .64rem; font-weight: 800; letter-spacing: .14em; line-height: 1.5; text-transform: uppercase; }

    .love-letter { position: relative; overflow: hidden; padding: clamp(2rem, 6vw, 5.5rem) clamp(1.35rem, 7vw, 6.5rem); border: 1px solid rgba(128, 83, 68, .15); background: #fffaf2; box-shadow: 0 28px 80px rgba(104, 64, 54, .14); }
    .love-letter::before, .love-letter::after { position: absolute; content: ''; pointer-events: none; }
    .love-letter::before { inset: .7rem; border: 1px solid rgba(185,120,130,.16); }
    .love-letter::after { top: -10rem; right: -7rem; width: 20rem; height: 20rem; border-radius: 50%; background: rgba(214, 172, 133, .11); }
    .letter-header, .letter-body, .letter-footer { position: relative; z-index: 1; }
    .letter-header { text-align: center; }
    .letter-header h1 { margin: 0; font-family: var(--font-display); font-size: clamp(2.5rem, 6vw, 5rem); font-weight: 400; letter-spacing: -.055em; line-height: .92; }
    .letter-rule { display: flex; align-items: center; gap: .8rem; max-width: 230px; margin: 1.5rem auto 2.4rem; color: var(--accent); }
    .letter-rule::before, .letter-rule::after { flex: 1; height: 1px; content: ''; background: rgba(185,120,130,.32); }
    .letter-rule span { font-size: 1.2rem; }

    .letter-body { color: #55494a; font-family: var(--font-display); font-size: clamp(1.05rem, 1.6vw, 1.18rem); line-height: 1.92; }
    .letter-body p { margin: 0 0 1.35em; text-align: justify; text-wrap: pretty; }
    .letter-body p:not(.letter-emphasis):not(.letter-salutation):not(.letter-signature)::first-letter { initial-letter: 1; }
    .letter-salutation { margin-bottom: 2rem !important; color: var(--accent-deep); font-size: clamp(1.3rem, 2.2vw, 1.7rem); line-height: 1.35; text-align: left !important; }
    .letter-emphasis { margin-block: 1.65rem !important; padding-left: 1.1rem; border-left: 2px solid rgba(185,120,130,.42); color: var(--accent-deep); line-height: 1.55; text-align: left !important; }
    .letter-signature { margin-top: 2.7rem !important; color: var(--accent-deep); font-size: 1.18em; text-align: right !important; }
    .letter-footer { display: grid; justify-items: center; gap: 1.1rem; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(128,83,68,.16); text-align: center; }
    .letter-footer p { margin: 0; color: var(--text-muted); font-family: var(--font-body); font-size: .78rem; line-height: 1.6; }
    .paper-action { border-color: rgba(143,81,93,.18); }
    .letter-skip { display: block; margin: 1.5rem auto 0; color: var(--text-muted); }
    .letter-skip:hover { color: var(--accent-deep); }

    @keyframes photo-drift { from { transform: translateX(-24vw) rotate(var(--photo-rotation)); } to { transform: translateX(124vw) rotate(calc(var(--photo-rotation) + 8deg)); } }

    @media (max-width: 700px) {
      .birthday-content { margin-top: -4rem; }
      .birthday-content h1 { font-size: clamp(3.2rem, 17vw, 6.4rem); }
      .stage-index { display: none; }
      .floating-photo { width: 7.5rem; }
      .letter-layout { display: block; }
      .letter-aside { position: static; display: flex; justify-content: space-between; margin: 0 auto 1rem; padding: 0; }
      .aside-stamp { width: 3.2rem; height: 3.2rem; font-size: .86rem; }
      .aside-number { display: none; }
      .love-letter { padding: 2.1rem 1.3rem 2.5rem; }
      .love-letter::before { inset: .45rem; }
      .letter-body { font-size: 1.04rem; line-height: 1.82; }
      .letter-body p { text-align: left; }
      .letter-emphasis { margin-left: .2rem !important; }
      .letter-signature { text-align: left !important; }
    }

    @media (prefers-reduced-motion: reduce) {
      .floating-photo { animation: none; opacity: .45; transform: none; }
      .primary-action, .envelope-shape { transition: none; }
    }
  `]
})
export class BirthdayExperienceComponent implements AfterViewInit, OnDestroy, OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly journey = inject(BirthdayJourneyService);
  private readonly memoryService = inject(MemoryService);
  private readonly router = inject(Router);

  @ViewChild('fireworksCanvas', { static: false }) private readonly canvasRef?: ElementRef<HTMLCanvasElement>;

  protected readonly stage = signal<BirthdayStage>('fireworks');
  protected readonly letter: readonly BirthdayLetterBlock[] = BIRTHDAY_LETTER;
  protected readonly visiblePhotos = signal<readonly IntroFrame[]>([]);

  private readonly introPhotos = this.memoryService.getIntroPhotos();
  private readonly particles: FireworkParticle[] = [];
  private photoCursor = 0;
  private photoWindowId = 0;
  private photoTimer = 0;
  private frameId = 0;
  private lastFirework = 0;
  private context?: CanvasRenderingContext2D | null;
  private previousOverflow = '';

  ngOnInit(): void {
    this.journey.start();
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.refreshPhotoWindow();
    this.photoTimer = window.setInterval(() => this.refreshPhotoWindow(), 7600);
  }

  ngAfterViewInit(): void {
    window.setTimeout(() => this.focusSelector('.fireworks-stage .primary-action'), 80);
    if (this.prefersReducedMotion()) return;

    this.setupCanvas();
    this.frameId = window.requestAnimationFrame(this.animateFireworks);
    window.addEventListener('resize', this.handleResize);
    this.document.addEventListener('visibilitychange', this.handleVisibility);
  }

  ngOnDestroy(): void {
    if (this.photoTimer) window.clearInterval(this.photoTimer);
    if (this.frameId) window.cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    this.document.removeEventListener('visibilitychange', this.handleVisibility);
    this.document.body.style.overflow = this.previousOverflow;
    this.journey.stop();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.skip();
  }

  protected next(): void {
    if (this.stage() === 'fireworks') {
      this.stage.set('envelope');
      this.particles.length = 0;
      window.setTimeout(() => this.focusSelector('.envelope-button'), 80);
      return;
    }

    if (this.stage() === 'envelope') {
      this.stage.set('letter');
      window.setTimeout(() => this.document.getElementById('letter-title')?.focus(), 80);
    }
  }

  protected skip(): void {
    this.goToTimeline();
  }

  protected goToTimeline(): void {
    this.journey.markSeen();
    void this.router.navigateByUrl('/timeline').finally(() => this.journey.stop());
  }

  private refreshPhotoWindow(): void {
    if (this.introPhotos.length === 0) return;

    const size = Math.min(18, this.introPhotos.length);
    const frames = Array.from({ length: size }, (_, index): IntroFrame => {
      const photo = this.introPhotos[(this.photoCursor + index) % this.introPhotos.length];
      return {
        ...photo,
        key: `${photo.id}-${this.photoWindowId}`,
        top: `${4 + (index % 5) * 19}%`,
        delay: `${-((index % 6) * 1.7)}s`,
        duration: `${15 + (index % 5) * 1.8}s`,
        rotation: `${-7 + (index % 5) * 3}deg`
      };
    });

    this.visiblePhotos.set(frames);
    this.photoCursor = (this.photoCursor + Math.max(1, size - 5)) % this.introPhotos.length;
    this.photoWindowId += 1;
  }

  private readonly handleResize = (): void => {
    this.setupCanvas();
  };

  private readonly handleVisibility = (): void => {
    if (!this.document.hidden && this.stage() === 'fireworks' && !this.prefersReducedMotion()) {
      this.lastFirework = 0;
      this.frameId = window.requestAnimationFrame(this.animateFireworks);
    }
  };

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private focusSelector(selector: string): void {
    (this.document.querySelector(selector) as HTMLButtonElement | HTMLHeadingElement | null)?.focus();
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    this.context = canvas.getContext('2d');
    this.context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private readonly animateFireworks = (time = 0): void => {
    const ctx = this.context;
    if (!ctx || this.stage() !== 'fireworks' || this.document.hidden) {
      this.frameId = 0;
      return;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalCompositeOperation = 'lighter';

    if (time - this.lastFirework > 480) {
      this.spawnFirework();
      this.lastFirework = time;
    }

    for (const particle of this.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += .018;
      particle.alpha -= particle.decay;

      ctx.beginPath();
      ctx.shadowBlur = 12;
      ctx.shadowColor = `hsla(${particle.hue}, 100%, 72%, ${particle.alpha})`;
      ctx.fillStyle = `hsla(${particle.hue}, 100%, 76%, ${Math.max(particle.alpha, 0)})`;
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    this.particles.splice(0, this.particles.length, ...this.particles.filter((particle) => particle.alpha > 0));
    this.frameId = window.requestAnimationFrame(this.animateFireworks);
  };

  private spawnFirework(): void {
    const centerX = window.innerWidth * (.12 + Math.random() * .76);
    const centerY = window.innerHeight * (.12 + Math.random() * .47);
    const hue = [36, 346, 319, 278, 48][Math.floor(Math.random() * 5)];
    const count = 58;

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const speed = 1.15 + Math.random() * 2.7;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: .95,
        size: 1.1 + Math.random() * 2.4,
        hue: hue + Math.round((Math.random() - .5) * 18),
        decay: .009 + Math.random() * .014
      });
    }
  }
}
