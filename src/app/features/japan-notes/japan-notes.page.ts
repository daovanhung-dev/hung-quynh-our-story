import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JAPAN_NOTE_CHAPTERS } from '../../core/content/japan-notes.content';
import type { MemoryMedia } from '../../core/models/memory.model';
import { MemoryService } from '../../core/services/memory.service';
import { MediaFrameComponent } from '../../shared/components/media-frame/media-frame.component';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';

@Component({
  standalone: true,
  imports: [RouterLink, MediaFrameComponent, RevealOnScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="japan-notes-page">
      <header class="notes-hero" aria-labelledby="japan-notes-title">
        <div class="hero-brush" aria-hidden="true"></div>
        <div class="notes-seal" aria-hidden="true">H<br><span>♡</span><br>Q</div>
        <p class="notes-kicker">旅のしおり <span>·</span> 旅のお守り</p>
        <h1 id="japan-notes-title">Những điều anh muốn<br><em>em nhớ ở Nhật.</em></h1>
        <p class="notes-intro">Một vài lời dặn nhỏ, để em luôn thấy anh ở bên khi mình xa nhau.</p>
        <div class="notes-date"><span>Hùng <i>→</i> Quỳnh</span><span>05 · 09 · 2026</span></div>
      </header>

      <div class="notes-line" aria-hidden="true"></div>

      <section class="note-list" aria-label="Những lời dặn khi ở Nhật">
        @for (chapter of chapters; track chapter.id; let index = $index) {
          <article
            class="note-chapter"
            [class.note-chapter--reverse]="index % 2 === 1"
            [style.--chapter-delay]="index * 70 + 'ms'"
            appRevealOnScroll
          >
            <div class="chapter-meta">
              <span>{{ formatIndex(index) }}</span>
              <i aria-hidden="true"></i>
              <small>{{ chapter.japanese }}</small>
            </div>

            @if (chapterPhoto(index); as photo) {
              <figure class="chapter-photo" [attr.data-photo-id]="photo.id">
                <app-media-frame
                  [media]="photo"
                  [alt]="'Ảnh kỷ niệm cho lời dặn: ' + chapter.title"
                  [priority]="index === 0"
                  sizes="(max-width: 680px) 100vw, 38vw"
                />
                <figcaption>H ♡ Q <span>·</span> {{ formatIndex(index) }}</figcaption>
              </figure>
            }

            <div class="chapter-copy">
              <p class="chapter-japanese">{{ chapter.japanese }}</p>
              <h2>{{ chapter.title }}</h2>
              <p>{{ chapter.text }}</p>
              <span class="brush-mark" aria-hidden="true">◌</span>
            </div>
          </article>
        }
      </section>

      <footer class="notes-footer">
        <span class="footer-stamp" aria-hidden="true">気をつけて</span>
        <p>Anh ở đây, dù mình cách nhau bao xa.</p>
        <nav aria-label="Đi tiếp">
          <a routerLink="/birthday/home">Quay lại món quà <span aria-hidden="true">↗</span></a>
          <a routerLink="/timeline">Đi đến những kỷ niệm <span aria-hidden="true">↘</span></a>
        </nav>
      </footer>
    </main>
  `,
  styles: [`
    :host { display:block; }
    .japan-notes-page {
      --japan-paper:#f4eee2;
      --japan-paper-deep:#e7dcc9;
      --japan-ink:#282527;
      --japan-indigo:#253b55;
      --japan-vermilion:#b5483e;
      --japan-gold:#b28a53;
      position:relative;
      min-height:100dvh;
      overflow:hidden;
      background:
        radial-gradient(circle at 10% 7%,rgba(255,255,255,.75),transparent 18rem),
        radial-gradient(circle at 86% 30%,rgba(181,72,62,.07),transparent 20rem),
        var(--japan-paper);
      color:var(--japan-ink);
    }
    .japan-notes-page::before {
      position:absolute;
      inset:0;
      z-index:0;
      pointer-events:none;
      content:"";
      opacity:.38;
      background:
        repeating-linear-gradient(0deg,transparent 0 5px,rgba(60,42,33,.035) 6px 7px),
        repeating-linear-gradient(87deg,transparent 0 13px,rgba(255,255,255,.24) 14px 16px);
      mix-blend-mode:multiply;
    }
    .notes-hero,.notes-line,.note-list,.notes-footer { position:relative; z-index:1; }
    .notes-hero { display:grid; justify-items:center; width:min(100% - 2rem,1080px); margin:0 auto; padding:clamp(5rem,12vw,9rem) 1rem clamp(4rem,9vw,7rem); text-align:center; }
    .hero-brush { position:absolute; top:15%; right:2%; width:clamp(10rem,24vw,18rem); height:clamp(4rem,8vw,6rem); border-top:1px solid rgba(37,59,85,.2); border-radius:50%; opacity:.8; transform:rotate(-8deg); }
    .hero-brush::after { position:absolute; top:-.8rem; right:8%; width:75%; height:100%; border-top:5px solid rgba(37,59,85,.09); border-radius:50%; content:""; transform:rotate(3deg); }
    .notes-seal { display:grid; width:4.15rem; height:4.15rem; place-content:center; border:1px solid rgba(255,247,226,.8); outline:1px solid var(--japan-vermilion); outline-offset:-5px; background:var(--japan-vermilion); color:#fff5e7; font-family:var(--font-display); font-size:.9rem; line-height:.72; letter-spacing:.04em; transform:rotate(-5deg); }
    .notes-seal span { font-size:.78rem; }
    .notes-kicker { margin:1.65rem 0 1.25rem; color:var(--japan-indigo); font-size:.65rem; font-weight:700; letter-spacing:.2em; text-transform:uppercase; }
    .notes-kicker span { margin:0 .45rem; color:var(--japan-vermilion); }
    h1 { margin:0; color:var(--japan-ink); font-family:var(--font-display); font-size:clamp(3.1rem,8vw,7.3rem); font-weight:400; letter-spacing:-.065em; line-height:.86; }
    h1 em { color:var(--japan-vermilion); font-style:italic; }
    .notes-intro { max-width:30rem; margin:1.8rem auto 0; color:#675e57; font-size:.88rem; line-height:1.85; }
    .notes-date { display:flex; align-items:center; gap:1.2rem; margin-top:2.2rem; color:#71685e; font-size:.65rem; font-weight:600; letter-spacing:.14em; text-transform:uppercase; }
    .notes-date i { color:var(--japan-vermilion); font-style:normal; }
    .notes-date span + span { padding-left:1.2rem; border-left:1px solid rgba(40,37,39,.25); }
    .notes-line { width:1px; height:5rem; margin:0 auto; background:linear-gradient(var(--japan-vermilion),transparent); }
    .note-list { width:min(100% - 2rem,1080px); margin:0 auto; }
    .note-chapter { display:grid; grid-template-columns:5.2rem minmax(0,1fr) minmax(0,1fr); gap:clamp(1.5rem,5vw,5rem); align-items:center; padding:clamp(3.5rem,8vw,7rem) clamp(.25rem,2vw,1.5rem); border-bottom:1px solid rgba(40,37,39,.17); }
    .note-chapter--reverse .chapter-photo { order:3; }
    .note-chapter--reverse .chapter-copy { order:2; }
    .note-chapter--reverse .chapter-meta { order:1; }
    .chapter-meta { display:grid; align-content:center; justify-items:center; gap:.65rem; align-self:stretch; color:var(--japan-indigo); }
    .chapter-meta span { font-family:var(--font-display); font-size:1.2rem; }
    .chapter-meta i { display:block; width:1px; height:3.2rem; background:var(--japan-vermilion); opacity:.7; }
    .chapter-meta small { writing-mode:vertical-rl; font-size:.7rem; letter-spacing:.18em; }
    .chapter-photo { position:relative; width:min(100%,23rem); margin:0; padding:.55rem .55rem 2.2rem; justify-self:center; background:rgba(255,252,244,.76); box-shadow:0 18px 38px rgba(74,52,41,.11); transform:rotate(-2.2deg); }
    .note-chapter--reverse .chapter-photo { transform:rotate(2.2deg); }
    .chapter-photo::after { position:absolute; top:-.55rem; right:19%; width:4.5rem; height:1.3rem; border:1px solid rgba(178,138,83,.3); background:rgba(216,181,122,.18); content:""; transform:rotate(4deg); }
    .chapter-photo app-media-frame { display:block; aspect-ratio:4 / 5; }
    .chapter-photo figcaption { position:absolute; right:.8rem; bottom:.55rem; color:var(--japan-indigo); font-family:var(--font-display); font-size:.7rem; }
    .chapter-photo figcaption span { color:var(--japan-vermilion); }
    .chapter-copy { position:relative; max-width:27rem; padding:1rem 0; }
    .chapter-japanese { margin:0 0 .45rem; color:var(--japan-vermilion); font-family:var(--font-display); font-size:1.4rem; letter-spacing:.06em; }
    h2 { margin:0 0 1.1rem; color:var(--japan-indigo); font-family:var(--font-display); font-size:clamp(2rem,4vw,3.8rem); font-weight:400; letter-spacing:-.045em; line-height:.95; }
    .chapter-copy > p:not(.chapter-japanese) { max-width:25rem; margin:0; color:#514943; font-size:clamp(.95rem,1.5vw,1.08rem); line-height:1.95; }
    .brush-mark { display:block; margin-top:1.8rem; color:var(--japan-gold); font-family:var(--font-display); font-size:2.5rem; line-height:.5; transform:rotate(-24deg); }
    .notes-footer { display:grid; justify-items:center; padding:clamp(5rem,10vw,9rem) 1.25rem clamp(4rem,8vw,7rem); text-align:center; }
    .footer-stamp { display:grid; width:5.3rem; height:5.3rem; place-items:center; border:1px solid var(--japan-vermilion); color:var(--japan-vermilion); font-size:.66rem; font-weight:700; letter-spacing:.11em; writing-mode:vertical-rl; transform:rotate(-7deg); }
    .notes-footer p { margin:2rem 0; color:var(--japan-indigo); font-family:var(--font-display); font-size:clamp(1.35rem,3vw,2.2rem); }
    .notes-footer nav { display:flex; flex-wrap:wrap; justify-content:center; gap:.8rem 1.2rem; }
    .notes-footer a { display:inline-flex; align-items:center; gap:.7rem; min-height:44px; padding:.75rem 1rem; border:1px solid rgba(37,59,85,.35); color:var(--japan-indigo); font-size:.7rem; font-weight:700; letter-spacing:.08em; text-decoration:none; text-transform:uppercase; transition:background 180ms ease,color 180ms ease,transform 180ms ease; }
    .notes-footer a:hover { background:var(--japan-indigo); color:#fff9ee; transform:translateY(-2px); }
    .notes-footer a span { color:var(--japan-vermilion); font-size:1rem; }
    .notes-footer a:hover span { color:#f0c3a1; }
    @media (prefers-reduced-motion:no-preference) {
      .notes-seal { animation:stamp-in 900ms var(--ease-cinematic) both; }
      .chapter-photo { animation:photo-breathe 7s ease-in-out var(--chapter-delay) infinite alternate; }
      @supports (animation-timeline:view()) {
        .chapter-photo { animation-name:photo-drift; animation-duration:1ms; animation-timeline:view(block 10% 85%); animation-range:entry 0% cover 50%; animation-fill-mode:both; }
      }
    }
    @keyframes stamp-in { from { opacity:0; transform:rotate(-12deg) scale(.75); } to { opacity:1; transform:rotate(-5deg) scale(1); } }
    @keyframes photo-breathe { from { transform:translateY(0) rotate(-2.2deg); } to { transform:translateY(-7px) rotate(-1.3deg); } }
    @keyframes photo-drift { from { opacity:.6; transform:translateY(16px) rotate(-3deg) scale(.97); } to { opacity:1; transform:translateY(-2px) rotate(-1deg) scale(1); } }
    @media (max-width:680px) {
      .hero-brush { top:11%; right:-16%; opacity:.45; }
      .notes-hero { width:min(100% - 1.5rem,560px); padding-top:4.5rem; }
      h1 { font-size:clamp(2.8rem,14vw,5rem); }
      .notes-intro { font-size:.84rem; }
      .notes-date { gap:.75rem; font-size:.57rem; letter-spacing:.1em; }
      .notes-date span + span { padding-left:.75rem; }
      .note-list { width:min(100% - 1.5rem,560px); }
      .note-chapter,.note-chapter--reverse { display:grid; grid-template-columns:2.6rem minmax(0,1fr); gap:1.1rem; padding:3.5rem .25rem; }
      .chapter-meta,.note-chapter--reverse .chapter-meta { grid-column:1; grid-row:1 / span 2; order:1; align-self:start; }
      .chapter-meta i { height:2.5rem; }
      .chapter-photo,.note-chapter--reverse .chapter-photo { grid-column:2; grid-row:1; order:2; width:100%; transform:rotate(-1.5deg); }
      .chapter-copy,.note-chapter--reverse .chapter-copy { grid-column:2; grid-row:2; order:3; max-width:none; padding-top:1.5rem; }
      .chapter-copy > p:not(.chapter-japanese) { font-size:.93rem; line-height:1.85; }
      .notes-footer nav { width:min(100%,22rem); }
      .notes-footer a { width:100%; justify-content:space-between; }
    }
    @media (prefers-reduced-motion:reduce) {
      .notes-seal,.chapter-photo { animation:none!important; }
      .chapter-photo,.note-chapter--reverse .chapter-photo { transform:rotate(-1.5deg); }
    }
  `]
})
export class JapanNotesPage {
  private readonly memoryService = inject(MemoryService);

  protected readonly chapters = JAPAN_NOTE_CHAPTERS;
  protected readonly photos: readonly MemoryMedia[] = this.memoryService.getRandomImageMedia(this.chapters.length);

  protected chapterPhoto(index: number): MemoryMedia | undefined {
    return this.photos[index];
  }

  protected formatIndex(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}
