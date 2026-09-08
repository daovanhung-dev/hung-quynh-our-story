import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UNSAID_FINAL, UNSAID_NOTES } from '../../core/content/unsaid.content';
import { UnsaidMemoryStreamComponent } from './components/unsaid-memory-stream/unsaid-memory-stream.component';

@Component({
  standalone: true,
  imports: [RouterLink, UnsaidMemoryStreamComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="unsaid-page" aria-labelledby="unsaid-title">
      <app-unsaid-memory-stream />

      <header class="unsaid-hero">
        <div class="unsaid-seal" aria-hidden="true">H ♡ Q</div>
        <p class="unsaid-kicker">Một trang nhỏ ở phía sau lá thư</p>
        <h1 id="unsaid-title">Những điều anh<br><em>chưa nói.</em></h1>
        <p class="unsaid-intro">Có vài điều anh chưa viết vào lá thư.</p>
      </header>

      <section class="unsaid-notes" aria-labelledby="unsaid-notes-title">
        <div class="unsaid-notes-heading">
          <p class="unsaid-kicker">Gấp mở từng chút một</p>
          <h2 id="unsaid-notes-title">Những lời anh giữ lại</h2>
          <div class="unsaid-progress" role="status" [attr.aria-label]="openedCount() + ' trên ' + notes.length + ' lời nhắn đã được mở'">
            @for (note of notes; track note.id; let index = $index) {
              <span [class.is-open]="index < openedCount()" aria-hidden="true"></span>
            }
          </div>
        </div>

        <div class="unsaid-note-grid">
          @for (note of notes; track note.id; let index = $index) {
            <button
              type="button"
              class="unsaid-note"
              [class.is-open]="isOpened(note.id)"
              [attr.data-note-id]="note.id"
              [attr.data-opened]="isOpened(note.id)"
              [attr.aria-expanded]="isOpened(note.id)"
              [attr.aria-label]="isOpened(note.id) ? 'Lời nhắn ' + formatIndex(index) + ' đã mở' : 'Mở lời nhắn ' + formatIndex(index)"
              (click)="openNote(note.id)"
            >
              @if (isOpened(note.id)) {
                <span class="note-number" aria-hidden="true">{{ formatIndex(index) }}</span>
                <span class="note-text">{{ note.text }}</span>
                <span class="note-signature" aria-hidden="true">H ♡ Q</span>
              } @else {
                <span class="note-cover" aria-hidden="true">
                  <strong>H ♡ Q</strong>
                  <i></i>
                  <small>một lời nhắn</small>
                </span>
              }
              <span class="note-corner" aria-hidden="true"></span>
            </button>
          }
        </div>
      </section>

      @if (allOpened()) {
        <section class="unsaid-finale" aria-labelledby="unsaid-finale-title" aria-live="polite">
          <p>{{ finalCopy.prelude }}</p>
          <h2 id="unsaid-finale-title">{{ finalCopy.main }}</h2>
          <p>{{ finalCopy.after }}</p>
          <div class="finale-mark" aria-hidden="true">H ♡ Q</div>
          <small>04 · 01 · 2026 → ∞</small>
        </section>
      }

      <footer class="unsaid-footer">
        <nav aria-label="Đi tiếp">
          <a routerLink="/birthday" [queryParams]="{ stage: 'letter' }">Quay lại lá thư <span aria-hidden="true">↗</span></a>
          <a routerLink="/timeline">Đi đến những kỷ niệm <span aria-hidden="true">↘</span></a>
        </nav>
      </footer>
    </main>
  `,
  styles: [`
    :host { display:block; }
    .unsaid-page { position:relative; min-height:100dvh; overflow:hidden; background:radial-gradient(circle at 12% 8%,rgba(216,181,122,.18),transparent 24rem),radial-gradient(circle at 90% 40%,rgba(166,84,98,.08),transparent 25rem),var(--paper); color:var(--ink); }
    .unsaid-page::before { position:absolute; inset:0; pointer-events:none; opacity:.28; background:repeating-linear-gradient(0deg,transparent 0 7px,rgba(76,58,60,.025) 8px 9px),repeating-linear-gradient(88deg,transparent 0 17px,rgba(255,255,255,.28) 18px 20px); content:''; mix-blend-mode:multiply; }
    .unsaid-hero,.unsaid-notes,.unsaid-finale,.unsaid-footer { position:relative; z-index:1; }
    .unsaid-hero { display:grid; justify-items:center; width:min(100% - 2rem,960px); margin:0 auto; padding:clamp(5rem,12vw,9rem) 1rem clamp(4rem,9vw,7rem); text-align:center; }
    .unsaid-seal { display:grid; width:4.5rem; height:4.5rem; place-items:center; border:1px solid var(--wine); outline:1px solid rgba(216,181,122,.7); outline-offset:-5px; color:var(--wine); font-family:var(--font-display); font-size:.8rem; letter-spacing:.05em; transform:rotate(-5deg); }
    .unsaid-kicker { margin:1.8rem 0 1.1rem; color:var(--wine); font-size:.64rem; font-weight:700; letter-spacing:.18em; text-transform:uppercase; }
    .unsaid-hero h1 { margin:0; font-family:var(--font-display); font-size:clamp(3.2rem,8vw,7.2rem); font-weight:400; letter-spacing:-.07em; line-height:.86; }
    .unsaid-hero h1 em { color:var(--wine); font-style:italic; }
    .unsaid-intro { margin:1.8rem 0 0; color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(1.1rem,2.2vw,1.4rem); }
    .unsaid-notes { width:min(100% - 2rem,1040px); margin:0 auto; padding:0 1rem clamp(5rem,10vw,8rem); }
    .unsaid-notes-heading { display:grid; justify-items:center; text-align:center; }
    .unsaid-notes-heading .unsaid-kicker { margin:.5rem 0 .8rem; }
    .unsaid-notes-heading h2 { margin:0; color:var(--ink); font-family:var(--font-display); font-size:clamp(2rem,4vw,3.6rem); font-weight:400; letter-spacing:-.05em; }
    .unsaid-progress { display:flex; gap:.5rem; margin-top:1.5rem; }
    .unsaid-progress span { display:block; width:9px; height:9px; border:1px solid var(--wine); border-radius:50%; background:transparent; transition:background 240ms ease,transform 240ms var(--ease-out); }
    .unsaid-progress span.is-open { background:var(--wine); transform:scale(1.12); }
    .unsaid-note-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:clamp(1rem,3vw,2.2rem); margin-top:clamp(2.5rem,6vw,5rem); }
    .unsaid-note { position:relative; display:grid; align-content:center; justify-items:center; min-height:230px; padding:2.2rem clamp(1.3rem,4vw,3rem); border:1px solid rgba(127,59,75,.17); background:linear-gradient(145deg,rgba(255,253,249,.94),rgba(241,231,220,.9)); box-shadow:var(--shadow-soft); color:var(--ink); cursor:pointer; text-align:center; transition:transform 240ms var(--ease-out),box-shadow 240ms ease,border-color 240ms ease,background 240ms ease; }
    .unsaid-note:nth-child(odd) { transform:rotate(-1.2deg); }
    .unsaid-note:nth-child(even) { transform:rotate(1.2deg); }
    .unsaid-note:hover,.unsaid-note:focus-visible { border-color:rgba(127,59,75,.42); box-shadow:0 22px 48px rgba(70,40,44,.14); transform:translateY(-4px) rotate(0deg); outline-offset:5px; }
    .unsaid-note.is-open { align-content:start; justify-items:start; min-height:250px; background:var(--surface); cursor:default; text-align:left; transform:none; }
    .note-cover { display:grid; justify-items:center; gap:1rem; color:var(--wine); font-family:var(--font-display); }
    .note-cover strong { font-family:var(--font-body); font-size:.72rem; letter-spacing:.17em; }
    .note-cover i { width:5rem; height:1px; background:var(--champagne); }
    .note-cover small { color:var(--text-muted); font-family:var(--font-body); font-size:.58rem; letter-spacing:.14em; text-transform:uppercase; }
    .note-number { color:var(--wine); font-size:.62rem; font-weight:700; letter-spacing:.14em; }
    .note-text { margin-top:1.2rem; color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(1.08rem,2vw,1.28rem); line-height:1.72; }
    .note-signature { margin-top:auto; align-self:end; color:var(--wine); font-family:var(--font-display); font-size:.82rem; }
    .note-corner { position:absolute; right:0; bottom:0; width:2.2rem; height:2.2rem; border-top:1px solid rgba(127,59,75,.2); border-left:1px solid rgba(127,59,75,.2); background:linear-gradient(135deg,transparent 48%,rgba(216,181,122,.35) 49% 52%,transparent 53%); clip-path:polygon(100% 0,100% 100%,0 100%); }
    .unsaid-finale { display:grid; justify-items:center; width:min(100% - 2rem,760px); margin:0 auto; padding:clamp(5rem,11vw,9rem) 1.25rem clamp(4rem,9vw,7rem); border-top:1px solid rgba(127,59,75,.18); text-align:center; animation:finale-in 700ms var(--ease-out) both; }
    .unsaid-finale p { margin:0; color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(1.1rem,2.2vw,1.45rem); line-height:1.7; }
    .unsaid-finale h2 { margin:1.2rem 0; color:var(--wine); font-family:var(--font-display); font-size:clamp(2.8rem,7vw,5.8rem); font-weight:400; letter-spacing:-.07em; line-height:.9; }
    .finale-mark { margin-top:2.2rem; color:var(--wine); font-size:.78rem; font-weight:700; letter-spacing:.16em; }
    .unsaid-finale small { margin-top:.65rem; color:var(--text-muted); font-size:.63rem; letter-spacing:.17em; }
    .unsaid-footer { display:grid; justify-items:center; padding:0 1.25rem clamp(4rem,8vw,7rem); }
    .unsaid-footer nav { display:flex; flex-wrap:wrap; justify-content:center; gap:.8rem 1.2rem; }
    .unsaid-footer a { display:inline-flex; align-items:center; justify-content:space-between; gap:.7rem; min-height:48px; padding:.8rem 1rem; border:1px solid rgba(127,59,75,.35); color:var(--wine); font-size:.68rem; font-weight:700; letter-spacing:.08em; text-decoration:none; text-transform:uppercase; transition:background 180ms ease,color 180ms ease,transform 180ms var(--ease-out); }
    .unsaid-footer a:hover { background:var(--wine); color:#fffdf9; transform:translateY(-2px); }
    .unsaid-footer a span { color:var(--champagne); font-size:1rem; }
    @keyframes finale-in { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } }
    @media (max-width:680px) {
      .unsaid-hero { width:min(100% - 1.5rem,560px); padding-top:4.5rem; }
      .unsaid-hero h1 { font-size:clamp(2.8rem,14vw,5rem); }
      .unsaid-notes { width:min(100% - 1.5rem,560px); padding-inline:.25rem; }
      .unsaid-note-grid { grid-template-columns:1fr; gap:1.3rem; }
      .unsaid-note,.unsaid-note.is-open { min-height:210px; }
      .unsaid-note.is-open { min-height:235px; }
      .unsaid-footer nav { width:min(100%,22rem); }
      .unsaid-footer a { width:100%; }
    }
    @media (prefers-reduced-motion:reduce) {
      .unsaid-note,.unsaid-note:nth-child(odd),.unsaid-note:nth-child(even),.unsaid-note:hover,.unsaid-note:focus-visible { transform:none; transition:none; }
      .unsaid-finale { animation:none; }
      .unsaid-progress span { transition:none; }
    }
  `]
})
export class UnsaidPage {
  protected readonly notes = UNSAID_NOTES;
  protected readonly finalCopy = UNSAID_FINAL;
  protected readonly openedNotes = signal<ReadonlySet<string>>(new Set());
  protected readonly openedCount = computed(() => this.openedNotes().size);
  protected readonly allOpened = computed(() => this.openedNotes().size === this.notes.length);

  protected isOpened(id: string): boolean {
    return this.openedNotes().has(id);
  }

  protected openNote(id: string): void {
    if (this.openedNotes().has(id)) return;
    const next = new Set(this.openedNotes());
    next.add(id);
    this.openedNotes.set(next);
  }

  protected formatIndex(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}
