import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
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
        </section>
        <p class="welcome-note" aria-hidden="true">Một nơi nhỏ để nhớ · Hùng</p>
      </div>
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
export class WelcomePage {
  private readonly router = inject(Router);
  private readonly entry = inject(SiteEntryService);

  protected openHub(): void {
    this.entry.markWelcomeSeen();
    void this.router.navigateByUrl('/events');
  }
}
