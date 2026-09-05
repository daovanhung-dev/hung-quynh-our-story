import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  signal
} from '@angular/core';
import { BIRTHDAY_CELEBRATION_CONFIG } from '../../../../core/constants/birthday-celebration.config';
import type { IntroPhoto } from '../../../../core/models/birthday.model';
import { buildFlyingMemories, pickRandomPhotos, type FlyingMemory } from '../../utils/birthday-photo-selector';

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  drag: number;
  gravity: number;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  speed: number;
  color: string;
  heart: boolean;
}

@Component({
  selector: 'app-birthday-celebration',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="celebration" aria-labelledby="celebration-title">
      <div class="ambient-glow" aria-hidden="true"></div>
      <div class="stars" aria-hidden="true">
        @for (star of stars; track $index) {
          <i [style.--x]="star.x + '%'" [style.--y]="star.y + '%'" [style.--delay]="star.delay + 'ms'" [style.--size]="star.size + 'px'"></i>
        }
      </div>

      <canvas #fireworksCanvas class="fireworks" aria-hidden="true"></canvas>

      <div class="flying-memories" aria-hidden="true">
        @for (memory of flyingMemories(); track memory.key; let index = $index) {
          <figure
            class="flying-memory"
            [style.--start-x]="memory.startX + 'vw'"
            [style.--start-y]="memory.startY + 'vh'"
            [style.--end-x]="memory.endX + 'vw'"
            [style.--end-y]="memory.endY + 'vh'"
            [style.--mid-x]="memory.midX + 'vw'"
            [style.--mid-y]="memory.midY + 'vh'"
            [style.--rotation-start]="memory.rotationStart + 'deg'"
            [style.--rotation-end]="memory.rotationEnd + 'deg'"
            [style.--scale]="memory.scale"
            [style.--photo-opacity]="memory.opacity"
            [style.--delay]="memory.delayMs + 'ms'"
            [style.--duration]="memory.durationMs + 'ms'"
            [style.--blur]="memory.blurPx + 'px'"
            [style.z-index]="memory.zIndex"
          >
            <img [src]="memory.photo.src" alt="" decoding="async" [attr.loading]="index < 4 ? 'eager' : 'lazy'" [attr.fetchpriority]="index < 2 ? 'high' : null" (error)="hideBrokenPhoto($event)">
            <figcaption>H ♡ Q</figcaption>
          </figure>
        }
      </div>

      <div class="floating-hearts" aria-hidden="true">
        @for (heart of hearts; track $index) {
          <span [style.--x]="heart.x + '%'" [style.--delay]="heart.delay + 'ms'" [style.--duration]="heart.duration + 'ms'" [style.--drift]="heart.drift + 'px'">{{ heart.glyph }}</span>
        }
      </div>

      @if (showConfetti()) {
        <div class="confetti" aria-hidden="true">
          @for (piece of confetti(); track $index) {
            <i [style.--x]="piece.x + '%'" [style.--delay]="piece.delay + 'ms'" [style.--rotation]="piece.rotation + 'deg'" [style.--fall]="piece.fall + 'vh'" [style.background]="piece.color"></i>
          }
        </div>
      }

      <div class="message" [class.title-visible]="showTitle()" [class.subtitle-visible]="showSubtitle()" [class.names-visible]="showNames()">
        <p class="eyebrow">For the girl I love</p>
        <h1 id="celebration-title">
          <span class="happy">Happy Birthday</span>
          <span class="my-love">My Love</span>
        </h1>
        <div class="heart-mark" aria-hidden="true">♡</div>
        <p class="names">Hùng <span>♡</span> Quỳnh</p>
      </div>

      <button class="skip" type="button" (click)="proceed.emit()">Bỏ qua</button>

      <div class="actions" [class.visible]="showCta()">
        <button class="gift-button" type="button" (click)="proceed.emit()">
          <span>Mở món quà của em</span>
          <i aria-hidden="true">♡</i>
        </button>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; background: #050305; }
    .celebration { position: relative; isolation: isolate; min-height: 100dvh; overflow: hidden; background: #050305; color: #fff9f0; }
    .ambient-glow { position: absolute; inset: 0; z-index: 1; background: radial-gradient(circle at 50% 42%, rgba(126,48,70,.28), transparent 34%), radial-gradient(circle at 18% 80%, rgba(215,177,112,.13), transparent 28%), radial-gradient(circle at 88% 18%, rgba(225,119,149,.12), transparent 24%); animation: glow-breathe 5s ease-in-out infinite alternate; }
    .stars, .flying-memories, .floating-hearts, .confetti { position: absolute; inset: 0; pointer-events: none; }
    .stars { z-index: 5; }
    .stars i { position: absolute; top: var(--y); left: var(--x); width: var(--size); height: var(--size); border-radius: 50%; background: #fffaf1; box-shadow: 0 0 10px rgba(255,244,218,.7); opacity: .2; animation: twinkle 2.8s ease-in-out var(--delay) infinite; }
    .fireworks { position: absolute; inset: 0; z-index: 20; width: 100%; height: 100%; pointer-events: none; }
    .flying-memories { z-index: 30; overflow: hidden; perspective: 900px; }
    .flying-memory { position: absolute; top: 0; left: 0; width: clamp(7.5rem, 14vw, 12.5rem); margin: 0; padding: .38rem .38rem 1.35rem; background: #fffaf1; box-shadow: 0 20px 55px rgba(0,0,0,.42); opacity: 0; filter: blur(var(--blur)); transform-origin: center; will-change: transform, opacity; animation: memory-flight var(--duration) cubic-bezier(.2,.65,.35,1) var(--delay) 2; }
    .flying-memory img { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; background: #21151a; }
    .flying-memory figcaption { position: absolute; right: .55rem; bottom: .26rem; color: #713b49; font-family: var(--font-display); font-size: .68rem; letter-spacing: .08em; }
    .floating-hearts { z-index: 34; }
    .floating-hearts span { position: absolute; left: var(--x); bottom: -8vh; color: rgba(245,193,205,.72); font-family: Georgia, serif; font-size: clamp(.75rem, 1.6vw, 1.35rem); text-shadow: 0 0 12px rgba(240,153,178,.45); animation: heart-drift var(--duration) linear var(--delay) infinite; }
    .confetti { z-index: 46; }
    .confetti i { position: absolute; top: -8vh; left: var(--x); width: 5px; height: 12px; border-radius: 1px; opacity: .85; transform: rotate(var(--rotation)); animation: confetti-fall 3.8s cubic-bezier(.12,.65,.25,1) var(--delay) both; }
    .message { position: relative; z-index: 55; display: grid; align-content: center; justify-items: center; min-height: 100dvh; padding: 5rem 1.25rem 8rem; text-align: center; pointer-events: none; }
    .eyebrow { margin: 0 0 1.25rem; color: rgba(255,248,238,.54); font-size: .64rem; font-weight: 600; letter-spacing: .28em; text-transform: uppercase; opacity: 0; transform: translateY(12px); transition: opacity 800ms ease, transform 800ms ease; }
    h1 { display: grid; margin: 0; font-family: var(--font-display); font-weight: 400; line-height: .82; letter-spacing: -.055em; }
    .happy, .my-love, .names, .heart-mark { opacity: 0; filter: blur(12px); transform: translateY(22px) scale(.97); transition: opacity 950ms cubic-bezier(.2,.7,.2,1), filter 950ms ease, transform 950ms cubic-bezier(.2,.7,.2,1); }
    .happy { font-size: clamp(3rem, 10vw, 8.5rem); text-transform: uppercase; }
    .my-love { margin-top: .42em; color: #f4d7a5; font-size: clamp(3.2rem, 11vw, 9.7rem); font-style: italic; text-shadow: 0 0 32px rgba(225,145,165,.16); }
    .heart-mark { margin-top: 1.2rem; color: #f3b1c1; font-size: clamp(2.1rem, 4vw, 3.7rem); }
    .names { margin: .4rem 0 0; color: rgba(255,248,238,.75); font-family: var(--font-display); font-size: clamp(1rem, 2.1vw, 1.45rem); letter-spacing: .08em; }
    .names span { color: #eaa3b5; }
    .title-visible .eyebrow, .title-visible .happy { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); }
    .subtitle-visible .my-love, .subtitle-visible .heart-mark { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); }
    .subtitle-visible .heart-mark { animation: heart-pulse 1.8s ease-in-out 900ms infinite; }
    .names-visible .names { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); }
    .skip { position: absolute; top: max(1rem, env(safe-area-inset-top)); right: 1rem; z-index: 70; min-height: 42px; padding: .4rem .7rem; border: 0; background: transparent; color: rgba(255,250,241,.58); cursor: pointer; font-size: .7rem; text-decoration: underline; text-underline-offset: .28rem; }
    .actions { position: absolute; right: 0; bottom: max(1.4rem, env(safe-area-inset-bottom)); left: 0; z-index: 70; display: grid; justify-items: center; padding: 0 1rem; opacity: 0; transform: translateY(16px); pointer-events: none; transition: opacity 700ms ease, transform 700ms ease; }
    .actions.visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .gift-button { display: inline-flex; align-items: center; gap: .9rem; min-height: 52px; padding: .9rem 1.2rem; border: 1px solid rgba(244,215,165,.55); background: rgba(14,8,11,.58); color: #fffaf1; backdrop-filter: blur(12px); cursor: pointer; font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; transition: transform 180ms ease, background 180ms ease; }
    .gift-button:hover { transform: translateY(-2px); background: rgba(111,52,68,.5); }
    .gift-button i { color: #f0adbd; font-family: Georgia, serif; font-size: 1.15rem; font-style: normal; }
    @keyframes memory-flight {
      0% { opacity: 0; transform: translate3d(var(--start-x), var(--start-y), 0) rotate(var(--rotation-start)) scale(calc(var(--scale) * .9)); }
      9% { opacity: var(--photo-opacity); }
      52% { opacity: var(--photo-opacity); transform: translate3d(var(--mid-x), var(--mid-y), 30px) rotate(0deg) scale(var(--scale)); }
      90% { opacity: var(--photo-opacity); }
      100% { opacity: 0; transform: translate3d(var(--end-x), var(--end-y), 0) rotate(var(--rotation-end)) scale(calc(var(--scale) * 1.06)); }
    }
    @keyframes twinkle { 0%,100% { opacity: .12; transform: scale(.65); } 50% { opacity: .85; transform: scale(1.25); } }
    @keyframes heart-drift { from { opacity: 0; transform: translate3d(0,0,0) rotate(-8deg); } 12% { opacity: .65; } 88% { opacity: .5; } to { opacity: 0; transform: translate3d(var(--drift), -116vh, 0) rotate(15deg); } }
    @keyframes confetti-fall { from { opacity: 0; transform: translate3d(0,0,0) rotate(var(--rotation)); } 8% { opacity: .9; } to { opacity: 0; transform: translate3d(28px, var(--fall), 0) rotate(calc(var(--rotation) + 540deg)); } }
    @keyframes heart-pulse { 0%,100% { transform: scale(1); } 45% { transform: scale(1.14); } }
    @keyframes glow-breathe { from { opacity: .72; transform: scale(1); } to { opacity: 1; transform: scale(1.04); } }
    @media (max-width: 640px) {
      .flying-memory { width: clamp(6.4rem, 31vw, 9rem); padding: .3rem .3rem 1.05rem; }
      .flying-memory figcaption { font-size: .58rem; }
      .message { padding-inline: .85rem; }
      .happy { font-size: clamp(2.65rem, 15vw, 4.7rem); line-height: .88; }
      .my-love { font-size: clamp(3.1rem, 17vw, 5.3rem); }
      .eyebrow { letter-spacing: .2em; }
    }
    @media (prefers-reduced-motion: reduce) {
      .ambient-glow, .stars i, .flying-memory, .floating-hearts span, .confetti i, .heart-mark { animation: none !important; }
      .flying-memory:nth-child(n + 4), .floating-hearts, .confetti, .fireworks { display: none; }
      .flying-memory { opacity: .18; transform: translate3d(6vw, 12vh, 0) rotate(-5deg) scale(.8); }
      .flying-memory:nth-child(2) { transform: translate3d(62vw, 20vh, 0) rotate(5deg) scale(.72); }
      .flying-memory:nth-child(3) { transform: translate3d(30vw, 69vh, 0) rotate(-2deg) scale(.68); }
      .happy, .my-love, .names, .heart-mark, .eyebrow { transition-duration: 120ms; filter: none; }
    }
  `]
})
export class BirthdayCelebrationComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) photos: readonly IntroPhoto[] = [];
  @Output() readonly proceed = new EventEmitter<void>();
  @ViewChild('fireworksCanvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  protected readonly showTitle = signal(false);
  protected readonly showSubtitle = signal(false);
  protected readonly showNames = signal(false);
  protected readonly showCta = signal(false);
  protected readonly showConfetti = signal(false);

  protected readonly flyingMemories = signal<readonly FlyingMemory[]>([]);
  protected readonly stars = Array.from({ length: 68 }, (_, index) => ({
    x: (index * 47.37) % 100,
    y: (index * 73.91) % 100,
    delay: (index * 137) % 2600,
    size: 1 + (index % 3) * 0.55
  }));
  protected readonly hearts = Array.from({ length: 14 }, (_, index) => ({
    x: 5 + ((index * 29.7) % 90),
    delay: 900 + (index * 530) % 5600,
    duration: 7200 + (index % 5) * 650,
    drift: -32 + (index % 7) * 12,
    glyph: index % 3 === 0 ? '♥' : '♡'
  }));
  protected readonly confetti = signal<readonly { x: number; delay: number; rotation: number; fall: number; color: string }[]>([]);

  private readonly particles: FireworkParticle[] = [];
  private readonly rockets: Rocket[] = [];
  private readonly timeouts: ReturnType<typeof setTimeout>[] = [];
  private animationFrame = 0;
  private fireworkTimer = 0;
  private reducedMotion = false;
  private lowPower = false;
  private destroyed = false;
  private ctx?: CanvasRenderingContext2D;
  private dpr = 1;

  ngAfterViewInit(): void {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.lowPower = window.innerWidth <= 640 || (navigator.hardwareConcurrency ?? 8) <= 4;
    const photoCount = this.reducedMotion
      ? 3
      : this.lowPower
        ? (window.innerWidth <= 640 ? BIRTHDAY_CELEBRATION_CONFIG.mobilePhotoCount : BIRTHDAY_CELEBRATION_CONFIG.lowPowerPhotoCount)
        : BIRTHDAY_CELEBRATION_CONFIG.desktopPhotoCount;

    this.flyingMemories.set(buildFlyingMemories(pickRandomPhotos(this.photos, photoCount)));
    this.buildConfetti();

    if (this.reducedMotion) {
      this.showTitle.set(true);
      this.showSubtitle.set(true);
      this.showNames.set(true);
      this.showCta.set(true);
      return;
    }

    this.schedule(this.showTitle, BIRTHDAY_CELEBRATION_CONFIG.titleDelayMs);
    this.schedule(this.showSubtitle, BIRTHDAY_CELEBRATION_CONFIG.subtitleDelayMs);
    this.schedule(this.showNames, BIRTHDAY_CELEBRATION_CONFIG.namesDelayMs);
    this.schedule(this.showConfetti, BIRTHDAY_CELEBRATION_CONFIG.namesDelayMs + 150);
    this.schedule(this.showCta, BIRTHDAY_CELEBRATION_CONFIG.ctaDelayMs);
    this.startCanvas();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    for (const timeout of this.timeouts) clearTimeout(timeout);
    window.clearTimeout(this.fireworkTimer);
    cancelAnimationFrame(this.animationFrame);
    this.particles.length = 0;
    this.rockets.length = 0;
  }

  @HostListener('document:visibilitychange')
  protected onVisibilityChange(): void {
    if (this.reducedMotion || this.destroyed) return;
    if (document.hidden) {
      cancelAnimationFrame(this.animationFrame);
      return;
    }
    this.animationFrame = requestAnimationFrame(() => this.drawFrame());
  }

  @HostListener('window:resize')
  protected onResize(): void {
    if (!this.reducedMotion) this.resizeCanvas();
  }

  protected hideBrokenPhoto(event: Event): void {
    const image = event.currentTarget as HTMLImageElement | null;
    if (image?.parentElement) image.parentElement.style.display = 'none';
  }

  private schedule(target: { set(value: boolean): void }, delay: number): void {
    this.timeouts.push(setTimeout(() => target.set(true), delay));
  }

  private buildConfetti(): void {
    const count = this.lowPower ? BIRTHDAY_CELEBRATION_CONFIG.mobileConfettiCount : BIRTHDAY_CELEBRATION_CONFIG.desktopConfettiCount;
    const colors = BIRTHDAY_CELEBRATION_CONFIG.colors;
    this.confetti.set(Array.from({ length: count }, (_, index) => ({
      x: (index * 31.71) % 100,
      delay: (index * 41) % 520,
      rotation: (index * 67) % 180,
      fall: 105 + (index % 6) * 4,
      color: colors[index % colors.length]
    })));
  }

  private startCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    this.ctx = canvas.getContext('2d') ?? undefined;
    if (!this.ctx) return;
    this.resizeCanvas();
    this.launchFireworkSequence();
    this.animationFrame = requestAnimationFrame(() => this.drawFrame());
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.ctx) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(width * this.dpr);
    canvas.height = Math.floor(height * this.dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private launchFireworkSequence(): void {
    const total = this.lowPower ? BIRTHDAY_CELEBRATION_CONFIG.mobileFireworkCount : BIRTHDAY_CELEBRATION_CONFIG.desktopFireworkCount;
    let launched = 0;
    const launch = (): void => {
      if (this.destroyed || launched >= total) return;
      const heart = launched === 1 || launched === 3 || launched === total - 1;
      this.launchRocket(heart);
      launched += 1;
      this.fireworkTimer = window.setTimeout(launch, 620 + Math.random() * 520);
    };
    this.fireworkTimer = window.setTimeout(launch, 1700);
  }

  private launchRocket(heart: boolean): void {
    const colors = BIRTHDAY_CELEBRATION_CONFIG.colors;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.rockets.push({
      x: width * (0.18 + Math.random() * 0.64),
      y: height + 12,
      targetY: height * (0.16 + Math.random() * 0.35),
      speed: 7.4 + Math.random() * 2.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      heart
    });
  }

  private drawFrame(): void {
    if (this.destroyed || document.hidden) return;
    const ctx = this.ctx;
    if (!ctx) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    for (let index = this.rockets.length - 1; index >= 0; index -= 1) {
      const rocket = this.rockets[index];
      rocket.y -= rocket.speed;
      ctx.beginPath();
      ctx.arc(rocket.x, rocket.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = rocket.color;
      ctx.fill();
      ctx.fillRect(rocket.x - .5, rocket.y + 3, 1, 14);
      if (rocket.y <= rocket.targetY) {
        if (rocket.heart) this.explodeHeart(rocket.x, rocket.y, rocket.color);
        else this.explodeRound(rocket.x, rocket.y, rocket.color);
        this.rockets.splice(index, 1);
      }
    }

    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.vx *= particle.drag;
      particle.vy = particle.vy * particle.drag + particle.gravity;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 1;
      if (particle.life <= 0) {
        this.particles.splice(index, 1);
        continue;
      }
      const alpha = Math.max(0, particle.life / particle.maxLife);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    this.animationFrame = requestAnimationFrame(() => this.drawFrame());
  }

  private explodeRound(x: number, y: number, color: string): void {
    const count = this.lowPower ? 24 : 38;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.08;
      const speed = 1.8 + Math.random() * 3.5;
      this.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 58 + Math.random() * 24);
    }
  }

  private explodeHeart(x: number, y: number, color: string): void {
    const count = this.lowPower ? 34 : 54;
    const scale = this.lowPower ? 0.24 : 0.3;
    for (let index = 0; index < count; index += 1) {
      const t = (Math.PI * 2 * index) / count;
      const hx = 16 * Math.sin(t) ** 3;
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      this.addParticle(x, y, hx * scale, -hy * scale, color, 70 + Math.random() * 28, 0.022);
    }
    for (let index = 0; index < (this.lowPower ? 8 : 14); index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = .5 + Math.random() * 1.7;
      this.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, '#fff8ec', 42 + Math.random() * 20);
    }
  }

  private addParticle(x: number, y: number, vx: number, vy: number, color: string, life: number, gravity = 0.035): void {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      life,
      maxLife: life,
      size: 1.1 + Math.random() * 1.5,
      color,
      drag: 0.982,
      gravity
    });
  }
}
