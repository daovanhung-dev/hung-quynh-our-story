import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/constants/site.config';
import { BIRTHDAY_WISHES, FUTURE_WISHES, LOVE_REASONS } from '../../core/content/birthday-copy.content';
import type { IntroPhoto } from '../../core/models/birthday.model';
import { MemoryService } from '../../core/services/memory.service';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { BirthdayCakeComponent } from './components/birthday-cake/birthday-cake.component';

@Component({
  selector: 'app-birthday-home',
  standalone: true,
  imports: [RouterLink, BirthdayCakeComponent, RevealOnScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="birthday-home">
      <section class="hero" aria-labelledby="birthday-home-title">
        <div class="hero-glow" aria-hidden="true"></div>
        <div class="hero-copy">
          <p class="eyebrow">05 · 09 · 2026</p>
          <h1 id="birthday-home-title"><span>Happy 22nd Birthday,</span><strong>Quỳnh ♡</strong></h1>
          <p>Hôm nay, anh muốn dành cho em một nơi chỉ chứa những điều đẹp nhất của chúng mình.</p>
          <div class="hero-actions">
            <a routerLink="/timeline">Đi lại những ngày của chúng mình <span aria-hidden="true">↘</span></a>
            <a class="quiet" routerLink="/birthday">Xem lại món quà từ đầu</a>
          </div>
        </div>
        @if (heroPhotos.length) {
          <div class="hero-photos" aria-hidden="true">
            @for (photo of heroPhotos; track photo.id; let index = $index) {
              <figure [class]="'photo photo-' + index">
                <img [src]="photo.src" alt="" decoding="async" [attr.fetchpriority]="index === 0 ? 'high' : null">
                <figcaption>H ♡ Q</figcaption>
              </figure>
            }
          </div>
        }
        <p class="made-with-love">Made with love by Hùng</p>
      </section>

      <section class="story-date" appRevealOnScroll aria-labelledby="story-date-title">
        <p class="eyebrow">Our Story</p>
        <div class="counter"><strong>{{ daysTogether }}</strong><span>ngày có nhau</span></div>
        <h2 id="story-date-title">04 · 01 · 2026</h2>
        <p>Từ ngày ấy, những ngày bình thường của anh bắt đầu có thêm em.</p>
      </section>

      <section class="gift-index" appRevealOnScroll aria-labelledby="gift-index-title">
        <header>
          <p class="eyebrow">Món quà dành riêng cho em</p>
          <h2 id="gift-index-title">Mình mở từng phần nhé.</h2>
        </header>
        <div class="gift-links">
          <a routerLink="/timeline"><span>01</span><strong>Những ngày mình có nhau</strong><i>Memory Lane ↗</i></a>
          <a href="#reasons"><span>02</span><strong>12 điều anh muốn giữ lại</strong><i>For you ↓</i></a>
          <a href="#wish"><span>03</span><strong>Một điều ước cho tuổi 22</strong><i>Make a wish ↓</i></a>
          <a href="#future"><span>04</span><strong>Những ngày phía trước</strong><i>Our future ↓</i></a>
        </div>
      </section>

      <section id="reasons" class="reasons" aria-labelledby="reasons-title">
        <header appRevealOnScroll>
          <p class="eyebrow">12 little reasons</p>
          <h2 id="reasons-title">Mười hai điều<br>anh muốn nói với em.</h2>
          <p>Không phải để giải thích hết tình yêu. Chỉ là mười hai mảnh nhỏ anh muốn đặt vào món quà này.</p>
        </header>
        <div class="reason-grid">
          @for (reason of loveReasons; track $index; let index = $index) {
            <article appRevealOnScroll>
              <span>{{ formatIndex(index + 1) }}</span>
              <p>{{ reason }}</p>
            </article>
          }
        </div>
      </section>

      <section id="wish" class="wish" aria-labelledby="wish-title">
        <div class="wish-copy" appRevealOnScroll>
          <p class="eyebrow">Cho tuổi mới của em</p>
          <h2 id="wish-title">Tuổi 22 của Quỳnh.</h2>
          @for (wish of birthdayWishes; track wish) { <p>{{ wish }}</p> }
          <strong>Happy Birthday, My Love ♡</strong>
        </div>
      </section>

      <app-birthday-cake />

      <section id="future" class="future" aria-labelledby="future-title">
        <header appRevealOnScroll>
          <p class="eyebrow">From 04.01.2026 → someday</p>
          <h2 id="future-title">Có những ngày mình đã đi qua.<br>Và còn nhiều ngày anh muốn đi cùng em.</h2>
        </header>
        <ol>
          @for (item of futureWishes; track item; let index = $index) {
            <li appRevealOnScroll><span>{{ formatIndex(index + 1) }}</span><p>{{ item }}</p></li>
          }
        </ol>
      </section>

      <section class="finale" aria-labelledby="finale-title">
        <div class="finale-stars" aria-hidden="true">✦ · ♡ · ✦ · ♡ · ✦</div>
        @if (finalPhoto; as photo) {
          <figure appRevealOnScroll><img [src]="photo.src" alt="" decoding="async"><figcaption>05 · 09 · 2026</figcaption></figure>
        }
        <div class="finale-copy" appRevealOnScroll>
          <p>05.09.2004 · Một cô gái đã xuất hiện trên thế giới.</p>
          <p>04.01.2026 · Và rồi chúng mình chính thức bắt đầu yêu nhau.</p>
          <h2 id="finale-title">Happy 22nd Birthday,<br><em>người anh yêu.</em></h2>
          <strong>Hùng ♡ Quỳnh</strong>
          <nav aria-label="Lựa chọn cuối món quà">
            <a routerLink="/birthday">Xem lại từ đầu</a>
            <a routerLink="/timeline">Xem những kỷ niệm</a>
          </nav>
        </div>
      </section>
    </article>
  `,
  styles: [`
    :host { display:block; }
    .birthday-home { overflow:hidden; }
    .eyebrow { margin:0 0 .85rem; color:var(--wine); font-size:.66rem; font-weight:600; letter-spacing:.18em; text-transform:uppercase; }
    h1,h2 { margin:0; font-family:var(--font-display); font-weight:400; letter-spacing:-.06em; }
    .hero { position:relative; isolation:isolate; display:grid; min-height:calc(100dvh - 73px); align-items:center; overflow:hidden; padding:clamp(4rem,8vw,8rem) max(1.2rem,calc((100vw - 1240px)/2)); background:#25171b; color:#fffdf9; }
    .hero-glow { position:absolute; inset:0; z-index:-2; background:radial-gradient(circle at 67% 42%,rgba(166,84,98,.33),transparent 30rem),radial-gradient(circle at 10% 92%,rgba(216,181,122,.15),transparent 28rem); }
    .hero-copy { position:relative; z-index:8; width:min(720px,62vw); }
    .hero .eyebrow { color:var(--champagne); }
    .hero h1 { display:grid; font-size:clamp(3.5rem,8vw,8rem); line-height:.82; }
    .hero h1 span { color:#fffdf9; }
    .hero h1 strong { margin-top:.16em; color:#f1c5ce; font-weight:400; font-style:italic; }
    .hero-copy > p:not(.eyebrow) { max-width:510px; margin:1.7rem 0 2.2rem; color:rgba(255,253,249,.73); font-family:var(--font-display); font-size:clamp(1.08rem,2vw,1.35rem); line-height:1.65; }
    .hero-actions { display:flex; flex-wrap:wrap; gap:.7rem 1rem; align-items:center; }
    .hero-actions a { display:inline-flex; min-height:48px; align-items:center; gap:.75rem; padding:.75rem 1rem; border:1px solid rgba(255,253,249,.7); color:#fffdf9; font-size:.71rem; font-weight:600; letter-spacing:.08em; text-decoration:none; text-transform:uppercase; }
    .hero-actions .quiet { border-color:transparent; color:rgba(255,253,249,.65); text-decoration:underline; text-underline-offset:.28rem; }
    .hero-photos { position:absolute; inset:0; z-index:1; pointer-events:none; }
    .photo { position:absolute; margin:0; padding:.4rem .4rem 1.35rem; background:#fffaf1; box-shadow:0 26px 65px rgba(0,0,0,.32); }
    .photo img { width:100%; aspect-ratio:4/5; object-fit:cover; }
    .photo figcaption { position:absolute; right:.55rem; bottom:.28rem; color:#713b49; font-family:var(--font-display); font-size:.68rem; }
    .photo-0 { right:6%; top:13%; width:clamp(11rem,21vw,19rem); transform:rotate(6deg); }
    .photo-1 { right:25%; bottom:7%; width:clamp(7rem,13vw,11rem); opacity:.66; transform:rotate(-8deg); }
    .photo-2 { right:1%; bottom:6%; width:clamp(6rem,11vw,10rem); opacity:.55; transform:rotate(-2deg); }
    .made-with-love { position:absolute; right:1.5rem; bottom:1.25rem; z-index:9; margin:0; color:rgba(255,253,249,.45); font-size:.65rem; letter-spacing:.08em; }
    .story-date { display:grid; justify-items:center; padding:clamp(6rem,12vw,11rem) 1.2rem; background:var(--paper); text-align:center; }
    .counter { display:grid; margin:.4rem 0 1.6rem; }
    .counter strong { color:var(--wine); font-family:var(--font-display); font-size:clamp(5rem,15vw,12rem); font-weight:400; letter-spacing:-.08em; line-height:.75; }
    .counter span { margin-top:1rem; color:var(--text-muted); font-size:.72rem; letter-spacing:.14em; text-transform:uppercase; }
    .story-date h2 { font-size:clamp(2.2rem,5vw,4.7rem); }
    .story-date > p:last-child { max-width:540px; margin:1rem 0 0; color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(1.05rem,2vw,1.3rem); line-height:1.65; }
    .gift-index { width:min(1180px,calc(100% - 3rem)); margin:0 auto; padding:clamp(5rem,9vw,8rem) 0; }
    .gift-index header { display:grid; grid-template-columns:1fr minmax(260px,560px); gap:1rem 3rem; align-items:end; margin-bottom:2.8rem; }
    .gift-index header .eyebrow { grid-column:1/-1; }
    .gift-index h2 { grid-column:2; font-size:clamp(2.8rem,5.5vw,5.7rem); line-height:.9; }
    .gift-links { border-top:1px solid var(--border-strong); }
    .gift-links a { display:grid; grid-template-columns:72px 1fr auto; gap:1rem; align-items:center; min-height:94px; border-bottom:1px solid var(--border); color:var(--ink); text-decoration:none; transition:padding 220ms var(--ease-out),color 220ms var(--ease-out); }
    .gift-links a:hover { padding-left:.7rem; color:var(--wine); }
    .gift-links span { color:var(--wine); font-size:.68rem; letter-spacing:.15em; }
    .gift-links strong { font-family:var(--font-display); font-size:clamp(1.2rem,2.4vw,2rem); font-weight:400; }
    .gift-links i { color:var(--text-muted); font-size:.68rem; font-style:normal; letter-spacing:.08em; text-transform:uppercase; }
    .reasons { padding:clamp(6rem,10vw,10rem) max(1rem,calc((100vw - 1240px)/2)); background:#f1e4d7; }
    .reasons header { display:grid; grid-template-columns:minmax(0,1fr) minmax(270px,520px); gap:1rem 4rem; margin-bottom:4rem; }
    .reasons header .eyebrow { grid-column:1/-1; }
    .reasons h2 { font-size:clamp(3rem,6vw,6.2rem); line-height:.88; }
    .reasons header > p:last-child { align-self:end; margin:0; color:var(--text-secondary); font-family:var(--font-display); font-size:1.08rem; line-height:1.65; }
    .reason-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1px; background:rgba(127,59,75,.15); border:1px solid rgba(127,59,75,.15); }
    .reason-grid article { min-height:260px; padding:clamp(1.4rem,3vw,2.5rem); background:#f8efe7; }
    .reason-grid span { color:var(--wine); font-size:.66rem; font-weight:600; letter-spacing:.16em; }
    .reason-grid p { margin:3rem 0 0; color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(1.05rem,1.7vw,1.28rem); line-height:1.65; }
    .wish { display:grid; min-height:90dvh; place-items:center; padding:6rem 1.2rem; background:radial-gradient(circle at 50% 25%,rgba(166,84,98,.25),transparent 26rem),#171013; color:#fff9f0; }
    .wish-copy { width:min(760px,100%); text-align:center; }
    .wish .eyebrow { color:var(--champagne); }
    .wish h2 { margin-bottom:2.2rem; font-size:clamp(3.5rem,8vw,7.8rem); line-height:.86; }
    .wish-copy > p:not(.eyebrow) { margin:0 auto 1.15rem; color:rgba(255,249,240,.72); font-family:var(--font-display); font-size:clamp(1.1rem,2vw,1.4rem); line-height:1.7; }
    .wish strong { display:block; margin-top:2.4rem; color:#f1c5ce; font-family:var(--font-display); font-size:clamp(1.5rem,3vw,2.6rem); font-weight:400; }
    .future { padding:clamp(6rem,10vw,10rem) max(1rem,calc((100vw - 1180px)/2)); background:var(--paper); }
    .future header { max-width:880px; margin-bottom:4rem; }
    .future h2 { font-size:clamp(3rem,6vw,6rem); line-height:.9; }
    .future ol { margin:0; padding:0; list-style:none; border-top:1px solid var(--border-strong); }
    .future li { display:grid; grid-template-columns:86px 1fr; align-items:center; min-height:110px; border-bottom:1px solid var(--border); }
    .future li span { color:var(--wine); font-size:.66rem; font-weight:600; letter-spacing:.16em; }
    .future li p { margin:0; font-family:var(--font-display); font-size:clamp(1.2rem,2.6vw,2.1rem); line-height:1.2; }
    .finale { position:relative; display:grid; min-height:100dvh; place-items:center; align-content:center; gap:3rem; overflow:hidden; padding:6rem 1.2rem; background:#080506; color:#fff9f0; text-align:center; }
    .finale-stars { position:absolute; inset:auto 0 8%; color:rgba(216,181,122,.3); font-size:1rem; letter-spacing:2rem; white-space:nowrap; }
    .finale figure { position:relative; z-index:2; width:min(52vw,300px); margin:0; padding:.42rem .42rem 1.45rem; background:#fffaf1; transform:rotate(-2deg); box-shadow:0 28px 80px rgba(0,0,0,.5); }
    .finale figure img { width:100%; aspect-ratio:4/5; object-fit:cover; }
    .finale figcaption { position:absolute; right:.6rem; bottom:.3rem; color:#713b49; font-family:var(--font-display); font-size:.66rem; }
    .finale-copy { position:relative; z-index:2; max-width:820px; }
    .finale-copy > p { margin:.35rem 0; color:rgba(255,249,240,.5); font-size:.72rem; letter-spacing:.05em; }
    .finale h2 { margin:1.6rem 0 1.2rem; font-size:clamp(3.3rem,8vw,7.5rem); line-height:.86; }
    .finale h2 em { color:#f1c5ce; font-weight:400; }
    .finale-copy > strong { color:var(--champagne); font-family:var(--font-display); font-size:1.2rem; font-weight:400; }
    .finale nav { display:flex; flex-wrap:wrap; justify-content:center; gap:.7rem 1rem; margin-top:2rem; }
    .finale nav a { min-height:44px; padding:.7rem .9rem; border:1px solid rgba(255,249,240,.25); color:#fff9f0; font-size:.68rem; letter-spacing:.08em; text-decoration:none; text-transform:uppercase; }
    @media (max-width:800px) { .reason-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .reasons header { grid-template-columns:1fr; } .reasons header .eyebrow { grid-column:1; } .gift-index header { display:block; } .gift-index h2 { margin-top:.6rem; } }
    @media (max-width:620px) {
      .hero { min-height:calc(100dvh - 105px); align-items:end; padding:5rem 1rem 4.2rem; }
      .hero-copy { width:100%; }
      .hero-copy > p:not(.eyebrow) { max-width:82%; }
      .hero-photos { opacity:.5; }
      .photo-0 { right:-8%; top:7%; width:48vw; }
      .photo-1 { right:36%; top:18%; bottom:auto; width:28vw; }
      .photo-2 { display:none; }
      .gift-index { width:calc(100% - 2rem); }
      .gift-links a { grid-template-columns:44px 1fr; min-height:88px; }
      .gift-links i { display:none; }
      .reason-grid { grid-template-columns:1fr; }
      .reason-grid article { min-height:210px; }
      .reason-grid p { margin-top:2rem; }
      .future li { grid-template-columns:52px 1fr; }
      .finale figure { width:min(68vw,260px); }
    }
  `]
})
export class BirthdayHomeComponent {
  private readonly memoryService = inject(MemoryService);
  protected readonly site = SITE_CONFIG;
  protected readonly loveReasons = LOVE_REASONS;
  protected readonly birthdayWishes = BIRTHDAY_WISHES;
  protected readonly futureWishes = FUTURE_WISHES;
  protected readonly heroPhotos: readonly IntroPhoto[] = this.pickHeroPhotos(this.memoryService.getIntroPhotos());
  protected readonly finalPhoto = this.heroPhotos[0];
  protected readonly daysTogether = this.calculateDaysTogether(SITE_CONFIG.relationship.startedAt);

  protected formatIndex(value: number): string { return String(value).padStart(2, '0'); }

  private pickHeroPhotos(photos: readonly IntroPhoto[]): readonly IntroPhoto[] {
    if (photos.length <= 3) return photos;
    return [photos[0], photos[Math.floor(photos.length / 2)], photos[photos.length - 1]];
  }

  private calculateDaysTogether(startDate: string): number {
    const [year, month, day] = startDate.split('-').map(Number);
    const start = Date.UTC(year, month - 1, day);
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(0, Math.floor((today - start) / 86_400_000));
  }
}
