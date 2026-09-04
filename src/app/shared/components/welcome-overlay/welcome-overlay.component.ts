import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  signal
} from '@angular/core';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  decay: number;
}

@Component({
  selector: 'app-welcome-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <section class="overlay" aria-label="Chào mừng" (click)="close()">
        <canvas #canvas class="fireworks" aria-hidden="true"></canvas>
        <div class="stars"></div>
        <div class="copy" (click)="$event.stopPropagation()">
          <p class="eyebrow">Welcome love</p>
          <h1>{{ title }}</h1>
          <p class="subtitle">{{ subtitle }}</p>
          <button type="button" (click)="close()">Mở những kỷ niệm của chúng mình</button>
        </div>
        <button type="button" class="skip" (click)="$event.stopPropagation(); close()">Bỏ qua</button>
      </section>
    }
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 200;
      display: grid;
      place-items: center;
      padding: 2rem;
      background: #050505;
      color: white;
      overflow: hidden;
      animation: fade-in 320ms ease both;
    }

    .fireworks,
    .stars {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .stars {
      background:
        radial-gradient(circle at 12% 18%, rgba(255,255,255,.95) 0 1px, transparent 1.6px),
        radial-gradient(circle at 72% 24%, rgba(255,255,255,.8) 0 1px, transparent 1.5px),
        radial-gradient(circle at 88% 70%, rgba(255,255,255,.72) 0 1px, transparent 1.5px),
        radial-gradient(circle at 40% 64%, rgba(255,255,255,.65) 0 1px, transparent 1.5px),
        radial-gradient(circle at 22% 82%, rgba(255,255,255,.85) 0 1px, transparent 1.5px);
      opacity: .55;
      pointer-events: none;
    }

    .copy {
      position: relative;
      z-index: 2;
      width: min(780px, 100%);
      text-align: center;
      padding: 2rem;
    }

    .eyebrow {
      margin: 0 0 .8rem;
      color: rgba(255,255,255,.76);
      font-size: .82rem;
      font-weight: 700;
      letter-spacing: .24em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(3rem, 11vw, 7rem);
      letter-spacing: -.05em;
      line-height: .92;
    }

    .subtitle {
      max-width: 580px;
      margin: 1rem auto 0;
      color: rgba(255,255,255,.78);
      line-height: 1.75;
    }

    button {
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 999px;
      background: rgba(255,255,255,.08);
      color: white;
      backdrop-filter: blur(12px);
      cursor: pointer;
    }

    .copy button {
      margin-top: 1.6rem;
      padding: .92rem 1.25rem;
    }

    .skip {
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 2;
      padding: .65rem .95rem;
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .overlay { animation: none; }
      .fireworks { display: none; }
    }
  `]
})
export class WelcomeOverlayComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) private readonly canvasRef?: ElementRef<HTMLCanvasElement>;
  @Input() title = 'Hùng ♡ Quỳnh';
  @Input() subtitle = 'Một góc nhỏ để thời gian đi qua nhưng kỷ niệm vẫn ở lại.';

  protected readonly visible = signal(true);

  private context?: CanvasRenderingContext2D | null;
  private particles: Particle[] = [];
  private frameId = 0;
  private autoCloseId = 0;
  private launchAt = 0;

  ngAfterViewInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.autoCloseId = window.setTimeout(() => this.close(), 2400);
      return;
    }

    this.setupCanvas();
    this.loop();
    this.autoCloseId = window.setTimeout(() => this.close(), 4200);
    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy(): void {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    if (this.autoCloseId) clearTimeout(this.autoCloseId);
    window.removeEventListener('resize', this.handleResize);
  }

  protected close(): void {
    this.visible.set(false);
  }

  private readonly handleResize = (): void => {
    this.setupCanvas();
  };

  private setupCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    this.context = canvas.getContext('2d');
    this.context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private loop = (time = 0): void => {
    const ctx = this.context;
    const canvas = this.canvasRef?.nativeElement;
    if (!ctx || !canvas || !this.visible()) return;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (time - this.launchAt > 420) {
      this.spawnFirework();
      this.launchAt = time;
    }

    for (const particle of this.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.018;
      particle.alpha -= particle.decay;

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, ${180 + Math.floor(Math.random() * 75)}, ${190 + Math.floor(Math.random() * 55)}, ${Math.max(particle.alpha, 0)})`;
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }

    this.particles = this.particles.filter((particle) => particle.alpha > 0);
    this.frameId = requestAnimationFrame(this.loop);
  };

  private spawnFirework(): void {
    const centerX = window.innerWidth * (0.16 + Math.random() * 0.68);
    const centerY = window.innerHeight * (0.14 + Math.random() * 0.42);
    const count = 42;

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const speed = 1.2 + Math.random() * 2.7;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: .95,
        size: 1.5 + Math.random() * 2.3,
        decay: .011 + Math.random() * .015
      });
    }
  }
}
