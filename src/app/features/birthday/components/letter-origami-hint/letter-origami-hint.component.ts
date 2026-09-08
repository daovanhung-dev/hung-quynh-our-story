import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal
} from '@angular/core';

type FoldStep = 0 | 1 | 2 | 3 | 4;

@Component({
  selector: 'app-letter-origami-hint',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="origami-hint"
      [class.is-reduced-motion]="reducedMotion()"
      [attr.data-origami-armed]="armed()"
      [attr.data-origami-mode]="origamiMode()"
      [attr.data-fold-step]="foldStep()"
      [attr.data-drag-progress]="dragProgress()"
    >
      <div #hintSentinel class="origami-sentinel" aria-hidden="true"></div>

      @if (armed() && !origamiMode() && foldStep() === 0) {
        <div class="origami-crease-stage">
          <button
            type="button"
            class="origami-crease-handle"
            [style.--drag-progress]="dragProgress()"
            [attr.data-origami-active-handle]="true"
            [attr.aria-label]="currentHandleLabel()"
            (pointerdown)="startPointer($event)"
            (pointermove)="movePointer($event)"
            (pointerup)="endPointer($event)"
            (pointercancel)="cancelPointer($event)"
            (lostpointercapture)="cancelPointer($event)"
            (keydown)="handleKeydown($event)"
            (click)="handleClick($event)"
          >
            <span class="crease-surface" aria-hidden="true"></span>
            <span class="sr-only">{{ currentHandleLabel() }}</span>
          </button>
        </div>
      }

      @if (origamiMode()) {
        <div class="origami-backdrop">
          <section class="origami-dialog" role="dialog" aria-modal="true" aria-label="Gấp lá thư" tabindex="-1">
            <button type="button" class="origami-cancel" aria-label="Quay lại lá thư" (click)="cancelOrigami()">×</button>

            <div
              class="origami-paper"
              [class.fold-step-1]="foldStep() >= 1"
              [class.fold-step-2]="foldStep() >= 2"
              [class.fold-step-3]="foldStep() >= 3"
              [class.fold-step-4]="foldStep() >= 4"
              [class.is-heart]="heartComplete()"
              [attr.data-origami-paper-state]="heartComplete() ? 'heart' : 'folding'"
            >
              <div class="paper-base" aria-hidden="true"></div>
              <div class="fold-layer fold-right" aria-hidden="true"></div>
              <div class="fold-layer fold-left" aria-hidden="true"></div>
              <div class="fold-layer fold-bottom" aria-hidden="true"></div>
              <div class="fold-layer fold-top" aria-hidden="true"></div>

              @if (!heartComplete()) {
                <div class="paper-content" aria-hidden="true">
                  <strong>H ♡ Q</strong>
                  <span>Cho Quỳnh,<br>người anh thương.</span>
                  <i></i>
                  <b></b>
                  <small>05 · 09 · 2026</small>
                </div>

                @if (foldStep() < 4) {
                  <button
                    type="button"
                    class="origami-fold-handle"
                    [style.--drag-progress]="dragProgress()"
                    [attr.data-origami-active-handle]="true"
                    [attr.data-fold-handle-step]="foldStep()"
                    [attr.aria-label]="currentHandleLabel()"
                    (pointerdown)="startPointer($event)"
                    (pointermove)="movePointer($event)"
                    (pointerup)="endPointer($event)"
                    (pointercancel)="cancelPointer($event)"
                    (lostpointercapture)="cancelPointer($event)"
                    (keydown)="handleKeydown($event)"
                    (click)="handleClick($event)"
                  >
                    <span class="fold-handle-surface" aria-hidden="true"></span>
                    <span class="sr-only">{{ currentHandleLabel() }}</span>
                  </button>
                }
              } @else {
                <div class="heart-face" aria-hidden="true">
                  <strong>04.01.2026</strong>
                  <small>still folding our story</small>
                </div>
              }
            </div>

            @if (heartComplete()) {
              <p class="origami-completion-copy">Có những điều anh không viết trong lá thư này.<br>Nhưng anh vẫn muốn em biết.<br><span>H ♡ Q</span></p>
            }
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { position:relative; z-index:2; display:block; }
    .origami-hint { position:relative; min-height:52px; }
    .origami-sentinel { width:100%; height:1px; margin-top:1.1rem; }
    .origami-crease-stage { display:grid; justify-items:end; height:52px; }
    .origami-crease-handle,.origami-fold-handle { position:relative; display:grid; place-items:center; width:52px; height:52px; min-width:52px; min-height:52px; padding:0; border:0; background:transparent; color:var(--wine); cursor:grab; touch-action:none; }
    .origami-crease-handle:active,.origami-fold-handle:active { cursor:grabbing; }
    .crease-surface { position:relative; display:block; width:30px; height:30px; border-top:1px solid rgba(127,59,75,.24); border-right:1px solid rgba(127,59,75,.24); background:linear-gradient(135deg,transparent 48%,rgba(216,181,122,.22) 49% 52%,transparent 53%); opacity:0; transform:translate(calc(var(--drag-progress,0) * -4px),calc(var(--drag-progress,0) * -4px)) rotate(calc(var(--drag-progress,0) * -8deg)); transition:opacity 260ms ease,transform 220ms var(--ease-out); }
    .origami-crease-handle:hover .crease-surface,.origami-crease-handle:focus-visible .crease-surface,.origami-crease-handle:active .crease-surface { opacity:.28; }
    .origami-backdrop { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; overflow:auto; padding:1rem; background:rgba(43,32,35,.42); }
    .origami-dialog { position:relative; display:grid; justify-items:center; gap:1.2rem; width:min(100%,460px); padding:clamp(2rem,7vw,3.5rem) 1rem; outline:0; }
    .origami-cancel { position:absolute; top:.3rem; right:.3rem; z-index:3; display:grid; width:48px; height:48px; place-items:center; border:1px solid rgba(255,253,249,.42); background:rgba(43,32,35,.24); color:#fffdf9; cursor:pointer; font-size:1.7rem; line-height:1; }
    .origami-cancel:hover,.origami-cancel:focus-visible { background:rgba(43,32,35,.54); }
    .origami-paper { position:relative; width:min(390px,82vw); aspect-ratio:3 / 4; overflow:visible; background:var(--surface); box-shadow:0 28px 70px rgba(35,20,25,.26); transform:rotate(-1.5deg); transition:width 720ms var(--ease-cinematic),aspect-ratio 720ms var(--ease-cinematic),transform 720ms var(--ease-cinematic),clip-path 720ms var(--ease-cinematic); }
    .paper-base,.fold-layer { position:absolute; inset:0; }
    .paper-base { border:1px solid rgba(127,59,75,.2); background:linear-gradient(145deg,#fffdf9,#f1e5da); }
    .paper-base::before { position:absolute; inset:.7rem; border:1px solid rgba(216,181,122,.34); content:''; }
    .fold-layer { opacity:0; border:1px solid rgba(127,59,75,.12); background:linear-gradient(145deg,rgba(241,213,198,.96),rgba(255,250,242,.9)); transition:opacity 520ms var(--ease-cinematic),transform 720ms var(--ease-cinematic),clip-path 720ms var(--ease-cinematic); }
    .fold-right { clip-path:polygon(100% 0,100% 100%,42% 100%); transform-origin:100% 100%; }
    .fold-left { clip-path:polygon(0 0,58% 100%,0 100%); transform-origin:0 100%; }
    .fold-bottom { clip-path:polygon(0 100%,100% 100%,50% 38%); transform-origin:50% 100%; }
    .fold-top { clip-path:polygon(0 0,100% 0,50% 62%); transform-origin:50% 0; }
    .fold-step-1 .fold-right,.fold-step-2 .fold-left,.fold-step-3 .fold-bottom,.fold-step-4 .fold-top { opacity:1; }
    .fold-step-1 .fold-right { transform:rotate(-11deg); }
    .fold-step-2 .fold-left { transform:rotate(11deg); }
    .fold-step-3 .fold-bottom { transform:rotate(-7deg); }
    .fold-step-4 .fold-top { transform:rotate(7deg); }
    .paper-content { position:absolute; inset:0; z-index:1; display:grid; align-content:start; justify-items:center; gap:1rem; padding:3rem 2rem; color:var(--wine); font-family:var(--font-display); text-align:center; }
    .paper-content strong { font-family:var(--font-body); font-size:.7rem; letter-spacing:.15em; }
    .paper-content span { margin-top:1.3rem; font-size:clamp(1.65rem,5vw,2.5rem); line-height:.95; }
    .paper-content i { width:7rem; height:1px; background:var(--champagne); }
    .paper-content b { width:68%; height:5rem; opacity:.2; background:repeating-linear-gradient(0deg,transparent 0 13px,var(--wine) 14px 15px); }
    .paper-content small { margin-top:auto; color:var(--text-muted); font-family:var(--font-body); font-size:.58rem; letter-spacing:.14em; }
    .origami-fold-handle { position:absolute; right:1.1rem; bottom:1.1rem; z-index:2; }
    .fold-handle-surface { display:block; width:38px; height:38px; border-right:2px solid rgba(127,59,75,.25); border-bottom:2px solid rgba(127,59,75,.25); background:linear-gradient(135deg,transparent 47%,rgba(216,181,122,.3) 48% 53%,transparent 54%); opacity:.18; transform:translate(calc(var(--drag-progress,0) * -5px),calc(var(--drag-progress,0) * -5px)) rotate(calc(var(--drag-progress,0) * -10deg)); transition:opacity 220ms ease,transform 220ms var(--ease-out); }
    .origami-fold-handle:hover .fold-handle-surface,.origami-fold-handle:focus-visible .fold-handle-surface,.origami-fold-handle:active .fold-handle-surface { opacity:.48; }
    .origami-paper.is-heart { width:min(72vw,270px); aspect-ratio:1; border-radius:8px; background:transparent; clip-path:polygon(50% 95%,7% 51%,8% 28%,22% 13%,39% 15%,50% 29%,61% 15%,78% 13%,92% 28%,93% 51%); box-shadow:0 28px 70px rgba(35,20,25,.26); transform:rotate(-2deg); animation:heart-turn 800ms var(--ease-cinematic) both; }
    .is-heart .paper-base { border:0; background:linear-gradient(145deg,#8f4657,#542635); }
    .is-heart .paper-base::before,.is-heart .fold-layer { display:none; }
    .heart-face { position:absolute; inset:0; z-index:2; display:grid; align-content:center; justify-items:center; gap:.65rem; color:#f8dfb2; font-family:var(--font-display); text-align:center; }
    .heart-face strong { font-size:1.1rem; font-weight:400; letter-spacing:.08em; }
    .heart-face small { color:#fff7eb; font-family:var(--font-body); font-size:.55rem; letter-spacing:.12em; text-transform:uppercase; }
    .origami-completion-copy { margin:0; color:#fffdf9; font-family:var(--font-display); font-size:clamp(1rem,3vw,1.25rem); line-height:1.65; text-align:center; animation:copy-in 620ms var(--ease-out) both; }
    .origami-completion-copy span { color:#f4d7a5; font-family:var(--font-body); font-size:.72rem; letter-spacing:.16em; }
    .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap; }
    @keyframes heart-turn { from { opacity:.45; transform:rotate(-12deg) scale(.82); } to { opacity:1; transform:rotate(-2deg) scale(1); } }
    @keyframes copy-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
    @media (max-width:620px) { .origami-dialog { padding-inline:.35rem; } .origami-paper { width:min(82vw,360px); } .paper-content { padding:2.4rem 1.3rem; } }
    @media (prefers-reduced-motion:reduce) { .crease-surface,.fold-handle-surface,.origami-paper,.fold-layer,.origami-completion-copy { transition:none; animation:none; } .origami-paper.is-heart { transform:none; } }
  `]
})
export class LetterOrigamiHintComponent implements AfterViewInit, OnDestroy {
  @Output() readonly activeChange = new EventEmitter<boolean>();
  @Output() readonly completed = new EventEmitter<void>();

  @ViewChild('hintSentinel', { static: true }) private hintSentinel?: ElementRef<HTMLElement>;

  protected readonly armed = signal(false);
  protected readonly origamiMode = signal(false);
  protected readonly foldStep = signal<FoldStep>(0);
  protected readonly dragProgress = signal(0);
  protected readonly heartComplete = signal(false);
  protected readonly reducedMotion = signal(false);

  private readonly document = inject(DOCUMENT);
  private observer?: IntersectionObserver;
  private mediaQuery?: MediaQueryList;
  private activePointerId?: number;
  private activeHandle?: HTMLElement;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private pointerThreshold = 44;
  private previousBodyOverflow = '';
  private bodyLocked = false;
  private originalFocus?: HTMLElement;
  private completionTimer?: ReturnType<typeof setTimeout>;
  private focusTimer?: ReturnType<typeof setTimeout>;

  private readonly onMediaChange = (event: MediaQueryListEvent): void => {
    this.reducedMotion.set(event.matches);
  };

  ngAfterViewInit(): void {
    const view = this.document.defaultView;
    if (!view) return;

    this.mediaQuery = view.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion.set(this.mediaQuery.matches);
    this.mediaQuery.addEventListener('change', this.onMediaChange);

    const sentinel = this.hintSentinel?.nativeElement;
    if (!sentinel || typeof view.IntersectionObserver === 'undefined') {
      this.arm();
      return;
    }

    this.observer = new view.IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) this.arm();
    }, { threshold: 0.55 });
    this.observer.observe(sentinel);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.mediaQuery) this.mediaQuery.removeEventListener('change', this.onMediaChange);
    this.clearCompletionTimer();
    this.clearFocusTimer();
    this.resetPointerState();
    this.restoreBodyScroll();
  }

  protected currentHandleLabel(): string {
    switch (this.foldStep()) {
      case 0: return 'Gấp góc phải của lá thư';
      case 1: return 'Gấp góc trái của lá thư';
      case 2: return 'Gấp cạnh dưới của lá thư';
      case 3: return 'Gấp cạnh trên của lá thư';
      default: return 'Lá thư đã được gấp thành trái tim';
    }
  }

  protected startPointer(event: PointerEvent): void {
    if (!this.armed() || this.heartComplete() || this.activePointerId !== undefined) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

    const rect = target.getBoundingClientRect();
    this.activePointerId = event.pointerId;
    this.activeHandle = target;
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
    this.pointerThreshold = Math.max(44, Math.min(rect.width, rect.height) * 0.14);
    this.dragProgress.set(0);
    try {
      target.setPointerCapture?.(event.pointerId);
    } catch {
      // Synthetic pointer events may not have an active pointer to capture.
    }
    event.preventDefault();
  }

  protected movePointer(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    event.preventDefault();
    this.dragProgress.set(this.calculateProgress(event.clientX - this.pointerStartX, event.clientY - this.pointerStartY));
  }

  protected endPointer(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;

    const dx = event.clientX - this.pointerStartX;
    const dy = event.clientY - this.pointerStartY;
    const target = this.activeHandle;
    const success = this.matchesDirection(dx, dy);
    this.releasePointerCapture(target, event.pointerId);
    this.resetPointerState();

    if (success) {
      this.advanceFold(target);
    } else {
      this.dragProgress.set(0);
    }
  }

  protected cancelPointer(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    this.releasePointerCapture(this.activeHandle, event.pointerId);
    this.resetPointerState();
    this.dragProgress.set(0);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if ((event.key !== ' ' && event.key !== 'Enter') || event.repeat) return;
    event.preventDefault();
    event.stopPropagation();
    if (!this.armed() || this.heartComplete()) return;

    this.advanceFold(event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined);
  }

  protected handleClick(event: MouseEvent): void {
    event.preventDefault();
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected handleEscape(event: Event): void {
    if (!this.origamiMode()) return;
    event.preventDefault();
    event.stopPropagation();
    this.cancelOrigami();
  }

  protected cancelOrigami(): void {
    if (!this.origamiMode()) return;
    this.clearCompletionTimer();
    this.resetPointerState();
    this.origamiMode.set(false);
    this.foldStep.set(0);
    this.dragProgress.set(0);
    this.heartComplete.set(false);
    this.restoreBodyScroll();
    this.activeChange.emit(false);

    const focusTarget = this.originalFocus;
    this.originalFocus = undefined;
    this.clearFocusTimer();
    this.focusTimer = window.setTimeout(() => {
      if (focusTarget?.isConnected) {
        focusTarget.focus();
      } else {
        this.elementHandle('.origami-crease-handle')?.focus();
      }
      this.focusTimer = undefined;
    }, 0);
  }

  private arm(): void {
    if (this.armed()) return;
    this.armed.set(true);
    this.observer?.disconnect();
  }

  private advanceFold(source?: HTMLElement): void {
    if (this.foldStep() === 0) {
      this.originalFocus = source;
      this.origamiMode.set(true);
      this.lockBodyScroll();
      this.activeChange.emit(true);
    }

    const next = Math.min(this.foldStep() + 1, 4) as FoldStep;
    this.foldStep.set(next);
    this.dragProgress.set(0);

    if (next === 4) {
      this.heartComplete.set(true);
      this.clearCompletionTimer();
      this.completionTimer = window.setTimeout(() => this.finishCompletion(), 1400);
      return;
    }

    this.scheduleActiveHandleFocus();
  }

  private finishCompletion(): void {
    if (!this.origamiMode() || !this.heartComplete()) return;
    this.clearCompletionTimer();
    this.clearFocusTimer();
    this.origamiMode.set(false);
    this.restoreBodyScroll();
    this.activeChange.emit(false);
    this.completed.emit();
  }

  private matchesDirection(dx: number, dy: number): boolean {
    const threshold = this.pointerThreshold;
    switch (this.foldStep()) {
      case 0: return dx <= -threshold && dy <= -(threshold * 0.7);
      case 1: return dx >= threshold && dy <= -(threshold * 0.7);
      case 2: return dy <= -threshold && Math.abs(dx) <= threshold * 1.2;
      case 3: return dy >= threshold && Math.abs(dx) <= threshold * 1.2;
      default: return false;
    }
  }

  private calculateProgress(dx: number, dy: number): number {
    const threshold = this.pointerThreshold;
    let progress = 0;
    switch (this.foldStep()) {
      case 0: progress = Math.min(-dx / threshold, -dy / (threshold * 0.7)); break;
      case 1: progress = Math.min(dx / threshold, -dy / (threshold * 0.7)); break;
      case 2: progress = -dy / threshold; break;
      case 3: progress = dy / threshold; break;
    }
    return Math.max(0, Math.min(progress, 1));
  }

  private releasePointerCapture(target: HTMLElement | undefined, pointerId: number): void {
    if (!target?.hasPointerCapture?.(pointerId)) return;
    target.releasePointerCapture(pointerId);
  }

  private resetPointerState(): void {
    this.activePointerId = undefined;
    this.activeHandle = undefined;
    this.pointerStartX = 0;
    this.pointerStartY = 0;
    this.pointerThreshold = 44;
  }

  private lockBodyScroll(): void {
    if (this.bodyLocked) return;
    const body = this.document.body;
    if (!body) return;
    this.previousBodyOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    this.bodyLocked = true;
  }

  private restoreBodyScroll(): void {
    if (!this.bodyLocked) return;
    const body = this.document.body;
    if (body) body.style.overflow = this.previousBodyOverflow;
    this.previousBodyOverflow = '';
    this.bodyLocked = false;
  }

  private clearCompletionTimer(): void {
    if (this.completionTimer !== undefined) window.clearTimeout(this.completionTimer);
    this.completionTimer = undefined;
  }

  private scheduleActiveHandleFocus(): void {
    this.clearFocusTimer();
    this.focusTimer = window.setTimeout(() => {
      this.elementHandle('[data-origami-active-handle="true"]')?.focus();
      this.focusTimer = undefined;
    }, 0);
  }

  private clearFocusTimer(): void {
    if (this.focusTimer !== undefined) window.clearTimeout(this.focusTimer);
    this.focusTimer = undefined;
  }

  private elementHandle(selector: string): HTMLElement | null {
    return this.document.querySelector<HTMLElement>(selector);
  }
}
