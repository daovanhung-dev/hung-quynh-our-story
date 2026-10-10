import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MissYouGateService } from '../../core/services/miss-you-gate.service';
import { SiteEntryService } from '../../core/services/site-entry.service';
import { MemoryWallComponent } from '../../shared/components/memory-wall/memory-wall.component';

@Component({
  standalone: true,
  imports: [MemoryWallComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="welcome-page" aria-labelledby="welcome-title">
      <div class="welcome-stage">
        <app-memory-wall />
        <div class="welcome-wash" aria-hidden="true"></div>
        <section class="welcome-copy">
          <p class="eyebrow">H ♡ Q · memory archive</p>
          <h1 id="welcome-title">Góc kỷ niệm<br><em>anh và em.</em></h1>
          <p class="description">Những ngày bình thường được anh cất lại, để mỗi lần em ghé qua, mình lại có thể trở về bên nhau.</p>
          <button type="button" (click)="openHub()">Mở những lựa chọn cho em <span aria-hidden="true">↘</span></button>
          <button class="secret-trigger" type="button" (click)="openGate()">Có một điều nhỏ anh muốn gửi em <span aria-hidden="true">♡</span></button>
        </section>
        <p class="welcome-note" aria-hidden="true">Một nơi nhỏ để nhớ · Hùng</p>
      </div>
      <dialog #gateDialog class="miss-you-gate" aria-labelledby="gate-title" aria-describedby="gate-hint" (click)="onGateBackdrop($event)" (close)="resetGate()">
        <button class="gate-close" type="button" aria-label="Đóng cổng bí mật" (click)="closeGate()">×</button>
        <p class="gate-eyebrow">H ♡ Q · một lời nhắn</p>
        <h2 id="gate-title">Chồng nhớ Quỳnh</h2>
        <p id="gate-hint" class="gate-hint">Một mật mã nhỏ, có chữ hoa ở đầu và cuối.</p>
        <form (submit)="submitGate($event)" novalidate>
          <label for="miss-you-code">Mật mã</label>
          <input id="miss-you-code" name="miss-you-code" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" autofocus [value]="gateCode()" (input)="updateGateCode($event)">
          @if (gateError()) { <p class="gate-error" role="status">Chưa đúng rồi em, thử lại nhé.</p> }
          <button class="gate-submit" type="submit">Mở lời nhắn <span aria-hidden="true">↗</span></button>
        </form>
      </dialog>
    </main>
  `,
  styles: [`
    :host { display:block; }
    .welcome-page { min-height:calc(100dvh - 73px); background:var(--paper); }
    .welcome-stage { position:relative; isolation:isolate; display:grid; min-height:calc(100dvh - 73px); place-items:center; overflow:hidden; padding:clamp(2rem,5vw,5rem) 1rem; }
    .welcome-wash { position:absolute; inset:0; z-index:1; background:radial-gradient(circle at 50% 48%,rgba(247,241,233,.93) 0 13rem,rgba(247,241,233,.7) 25rem,rgba(247,241,233,.12) 47rem,transparent 70rem); pointer-events:none; }
    .welcome-copy { position:relative; z-index:2; display:grid; justify-items:center; width:min(100%,630px); padding:clamp(2rem,5vw,4.2rem) clamp(1.4rem,5vw,4rem); border:1px solid rgba(123,53,73,.2); background:rgba(255,253,251,.68); box-shadow:0 24px 90px rgba(70,40,44,.1); backdrop-filter:blur(7px); text-align:center; }
    .welcome-copy::before { position:absolute; inset:.6rem; border:1px solid rgba(213,180,124,.35); content:''; pointer-events:none; }
    .eyebrow { margin:0 0 1rem; color:var(--wine); font-size:.67rem; font-weight:600; letter-spacing:.16em; text-transform:uppercase; }
    h1 { margin:0; font-family:var(--font-display); font-size:clamp(3.5rem,8vw,7.5rem); font-weight:400; letter-spacing:-.07em; line-height:.86; }
    h1 em { color:var(--wine); font-weight:400; }
    .description { max-width:490px; margin:1.7rem 0 0; color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(1.05rem,2vw,1.25rem); line-height:1.7; }
    button { position:relative; display:inline-flex; align-items:center; justify-content:center; gap:.7rem; min-height:52px; margin-top:2rem; padding:.8rem 1.1rem; border:1px solid var(--button); background:var(--button); color:#fffdf9; cursor:pointer; font-size:.69rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase; transition:transform 180ms var(--ease-out),background 180ms var(--ease-out); }
    button:hover { background:var(--wine); transform:translateY(-2px); }
    button span { font-size:1rem; }
    .secret-trigger { min-height:44px; margin-top:.4rem; padding:.6rem .8rem; border-color:transparent; background:transparent; color:var(--wine); font-size:.68rem; letter-spacing:.025em; text-transform:none; }
    .secret-trigger:hover { background:rgba(123,53,73,.07); color:var(--wine); transform:none; }
    .secret-trigger:focus-visible,.gate-close:focus-visible,.gate-submit:focus-visible,input:focus-visible { outline:3px solid #d5b47c; outline-offset:3px; }
    .miss-you-gate { position:fixed; width:min(92vw,440px); max-width:none; max-height:min(88dvh,650px); margin:auto; padding:clamp(1.5rem,5vw,2.4rem); overflow:auto; border:1px solid rgba(123,53,73,.2); background:#fffdfb; color:var(--ink); box-shadow:0 28px 90px rgba(37,17,26,.32); }
    .miss-you-gate::backdrop { background:rgba(27,18,25,.62); backdrop-filter:blur(5px); }
    .gate-close { position:absolute; top:.7rem; right:.7rem; display:grid; width:44px; height:44px; place-items:center; border:0; background:transparent; color:var(--text-secondary); cursor:pointer; font-size:1.6rem; }
    .gate-eyebrow { margin:0 0 .5rem; color:var(--wine); font-size:.62rem; font-weight:700; letter-spacing:.15em; text-transform:uppercase; }
    .miss-you-gate h2 { margin:0; font-family:var(--font-display); font-size:clamp(2rem,7vw,3.1rem); font-weight:400; letter-spacing:-.04em; }
    .gate-hint { margin:.65rem 0 1.2rem; color:var(--text-secondary); font-family:var(--font-display); font-size:1rem; line-height:1.6; }
    .miss-you-gate form { display:grid; gap:.55rem; }
    .miss-you-gate label { color:var(--text-secondary); font-size:.68rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
    .miss-you-gate input { min-height:52px; width:100%; padding:.8rem .9rem; border:1px solid rgba(123,53,73,.3); background:#fff; color:var(--ink); font:inherit; letter-spacing:.08em; }
    .gate-error { margin:.25rem 0 0; color:#9d2946; font-size:.82rem; }
    .gate-submit { min-height:52px; margin-top:.45rem; border:1px solid var(--button); background:var(--button); color:#fffdf9; cursor:pointer; font:inherit; font-size:.7rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
    .gate-submit:hover { background:var(--wine); }
    .welcome-note { position:absolute; right:max(1.5rem,env(safe-area-inset-right)); bottom:max(1.2rem,env(safe-area-inset-bottom)); z-index:2; margin:0; color:var(--text-muted); font-size:.64rem; letter-spacing:.08em; }
    @media (max-width:680px) {
      .welcome-page,.welcome-stage { min-height:calc(100dvh - 105px); }
      .welcome-stage { align-items:center; padding:1.2rem .7rem 3.5rem; }
      .welcome-wash { background:radial-gradient(circle at 50% 47%,rgba(247,241,233,.96) 0 10rem,rgba(247,241,233,.78) 21rem,rgba(247,241,233,.18) 35rem,transparent 48rem); }
      .welcome-copy { padding:2rem 1rem 2.2rem; }
      h1 { font-size:clamp(3rem,14vw,5rem); }
      .description { margin-top:1.25rem; font-size:1rem; }
      button { width:min(100%,22rem); margin-top:1.5rem; }
      .welcome-note { right:1rem; bottom:.75rem; }
    }
  `]
})
export class WelcomePage implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly entry = inject(SiteEntryService);
  private readonly gate = inject(MissYouGateService);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('gateDialog', { static: true }) private readonly gateDialogRef!: ElementRef<HTMLDialogElement>;

  protected readonly gateCode = signal('');
  protected readonly gateError = signal(false);

  ngAfterViewInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params.get('openMissYouGate') !== '1') return;
      this.openGate();
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { openMissYouGate: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    });
  }

  protected openHub(): void {
    this.entry.markWelcomeSeen();
    void this.router.navigateByUrl('/events');
  }

  protected openGate(): void {
    if (!this.gateDialogRef.nativeElement.open) this.gateDialogRef.nativeElement.showModal();
  }

  protected closeGate(): void {
    this.gateDialogRef.nativeElement.close();
  }

  protected resetGate(): void {
    this.gateCode.set('');
    this.gateError.set(false);
  }

  protected updateGateCode(event: Event): void {
    this.gateCode.set((event.currentTarget as HTMLInputElement).value);
    this.gateError.set(false);
  }

  protected submitGate(event: SubmitEvent): void {
    event.preventDefault();
    if (!this.gate.unlock(this.gateCode())) {
      this.gateError.set(true);
      return;
    }
    this.gateDialogRef.nativeElement.close();
    void this.router.navigateByUrl('/hint/miss-you');
  }

  protected onGateBackdrop(event: MouseEvent): void {
    if (event.target === this.gateDialogRef.nativeElement) this.closeGate();
  }
}
