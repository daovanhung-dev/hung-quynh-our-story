import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EVENT_ITEMS, UTILITY_ITEMS } from '../../core/content/hub.content';
import type { HubItem } from '../../core/models/hub.model';

@Component({
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="hub-page" aria-labelledby="hub-title">
      <header class="hub-header">
        <p class="eyebrow">H ♡ Q · Our private corner</p>
        <h1 id="hub-title">Chọn một điều<br><em>để mở hôm nay.</em></h1>
        <p class="intro">Những điều anh làm riêng cho em, được cất thành từng góc nhỏ.</p>
      </header>

      <section class="hub-section" aria-labelledby="events-title">
        <div class="section-label">
          <span>01</span>
          <h2 id="events-title">Sự kiện</h2>
        </div>
        <div class="hub-grid">
          @for (item of events; track item.id) {
            <a class="hub-card hub-card--event" [routerLink]="item.route" [attr.data-item-id]="item.id">
              <span class="card-index">{{ item.dateLabel }}</span>
              <span class="card-status">Đang mở <i aria-hidden="true">↗</i></span>
              <span class="card-copy">
                <strong>{{ item.title }}</strong>
                <small>{{ item.description }}</small>
              </span>
              <span class="card-mark" aria-hidden="true">♡</span>
            </a>
          }
        </div>
      </section>

      <section class="hub-section hub-section--utilities" aria-labelledby="utilities-title">
        <div class="section-label">
          <span>02</span>
          <h2 id="utilities-title">Tiện ích cho em</h2>
        </div>
        @if (utilities.length === 0) {
          <article class="hub-card hub-card--locked" aria-disabled="true">
            <span class="card-index">Một góc đang được chuẩn bị</span>
            <span class="card-status">Sắp có <i aria-hidden="true">·</i></span>
            <span class="card-copy">
              <strong>Tiện ích đang được chuẩn bị</strong>
              <small>Anh sẽ thêm những điều nhỏ xinh để mỗi lần em ghé qua đều có thêm một bất ngờ.</small>
            </span>
            <span class="card-mark" aria-hidden="true">✦</span>
          </article>
        } @else {
          <div class="hub-grid">
            @for (item of utilities; track item.id) {
              <a class="hub-card" [routerLink]="item.route" [attr.data-item-id]="item.id">
                <span class="card-index">{{ item.dateLabel || 'Một điều nhỏ cho em' }}</span>
                <span class="card-status">Mở <i aria-hidden="true">↗</i></span>
                <span class="card-copy">
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.description }}</small>
                </span>
                <span class="card-mark" aria-hidden="true">♡</span>
              </a>
            }
          </div>
        }
      </section>

      <footer class="hub-footer">
        <span aria-hidden="true">H ♡ Q</span>
        <p>Góc riêng của hai đứa mình.</p>
      </footer>
    </main>
  `,
  styles: [`
    :host { display:block; }
    .hub-page { width:min(1120px,calc(100% - 3rem)); margin:0 auto; padding:clamp(4.5rem,10vw,9rem) 0 5rem; }
    .hub-header { max-width:780px; }
    .eyebrow,.section-label span { margin:0 0 .85rem; color:var(--wine); font-size:.67rem; font-weight:600; letter-spacing:.16em; text-transform:uppercase; }
    h1,h2 { margin:0; font-family:var(--font-display); font-weight:400; letter-spacing:-.065em; }
    h1 { font-size:clamp(3.4rem,8vw,7.5rem); line-height:.86; }
    h1 em { color:var(--wine); font-weight:400; }
    .intro { max-width:530px; margin:1.6rem 0 0; color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(1.05rem,2vw,1.3rem); line-height:1.7; }
    .hub-section { margin-top:clamp(5rem,10vw,9rem); }
    .section-label { display:flex; align-items:baseline; gap:1rem; margin-bottom:1.25rem; padding-bottom:.8rem; border-bottom:1px solid var(--border-strong); }
    .section-label span { margin:0; }
    .section-label h2 { font-size:clamp(2.3rem,5vw,4.5rem); line-height:.9; }
    .hub-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
    .hub-card { position:relative; display:grid; min-height:310px; align-content:space-between; gap:2rem; padding:clamp(1.4rem,3vw,2.5rem); overflow:hidden; border:1px solid var(--border-strong); background:var(--surface); color:var(--ink); text-decoration:none; transition:transform 220ms var(--ease-out),box-shadow 220ms var(--ease-out),border-color 220ms var(--ease-out); }
    .hub-card--event { min-height:380px; background:linear-gradient(145deg,#fffdf9 0%,#f1e4d7 100%); }
    .hub-card--event::before { position:absolute; right:-8%; bottom:-25%; width:18rem; height:18rem; border:1px solid rgba(127,59,75,.15); border-radius:50%; content:''; }
    .hub-card:hover { border-color:var(--wine); box-shadow:var(--shadow-soft); transform:translateY(-4px); }
    .hub-card--locked { border-style:dashed; background:rgba(255,253,249,.42); color:var(--text-muted); }
    .hub-card--locked:hover { border-color:var(--border-strong); box-shadow:none; transform:none; }
    .card-index { color:var(--wine); font-size:.65rem; font-weight:600; letter-spacing:.14em; text-transform:uppercase; }
    .card-status { position:absolute; top:clamp(1.4rem,3vw,2.5rem); right:clamp(1.4rem,3vw,2.5rem); color:var(--text-muted); font-size:.65rem; letter-spacing:.08em; text-transform:uppercase; }
    .card-status i { color:var(--wine); font-size:1rem; font-style:normal; }
    .card-copy { position:relative; z-index:1; display:grid; gap:.65rem; max-width:500px; }
    .card-copy strong { font-family:var(--font-display); font-size:clamp(2rem,4vw,4.2rem); font-weight:400; letter-spacing:-.055em; line-height:.92; }
    .card-copy small { max-width:390px; color:var(--text-secondary); font-family:var(--font-display); font-size:1rem; line-height:1.65; }
    .card-mark { position:absolute; right:clamp(1.4rem,3vw,2.5rem); bottom:clamp(1.2rem,2vw,2rem); color:var(--champagne); font-family:Georgia,serif; font-size:2.6rem; }
    .hub-section--utilities .card-copy strong { color:var(--text-secondary); font-size:clamp(1.8rem,3.5vw,3.3rem); }
    .hub-footer { display:grid; justify-items:center; gap:.5rem; margin-top:clamp(6rem,12vw,11rem); padding-top:2rem; border-top:1px solid var(--border); color:var(--text-muted); text-align:center; }
    .hub-footer span { color:var(--wine); font-size:.7rem; font-weight:600; letter-spacing:.14em; }
    .hub-footer p { margin:0; font-family:var(--font-display); font-size:1.1rem; }
    @media (max-width:680px) {
      .hub-page { width:min(calc(100% - 2rem),560px); padding-top:3rem; }
      h1 { font-size:clamp(3rem,14vw,5.2rem); }
      .hub-section { margin-top:4.5rem; }
      .hub-grid { grid-template-columns:1fr; }
      .hub-card,.hub-card--event { min-height:280px; }
      .card-copy strong { font-size:clamp(2rem,11vw,3.5rem); }
    }
  `]
})
export class EventHubPage {
  protected readonly events: readonly HubItem[] = EVENT_ITEMS;
  protected readonly utilities: readonly HubItem[] = UTILITY_ITEMS;
}
