import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HouseTimeService } from '../services/house-time.service';

@Component({
  selector: 'app-two-clocks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="clocks" aria-label="Đồng hồ theo giờ địa phương của Việt Nam và Nhật Bản">
      <p class="japan-date">{{ time.getJapanDate() }}</p>
      <div class="clock-row">
        <article><span class="flag" aria-hidden="true">🇻🇳</span><div><h3>Việt Nam</h3><p>{{ time.getVietnamClock() }}</p><small>Asia/Ho_Chi_Minh</small></div></article>
        <article><span class="flag" aria-hidden="true">🇯🇵</span><div><h3>Nhật Bản</h3><p>{{ time.getJapanClock() }}</p><small>Asia/Tokyo</small></div></article>
      </div>
      <p class="clock-note">Giờ được hiển thị theo múi giờ của mỗi nơi, không phụ thuộc cài đặt giờ trên thiết bị.</p>
    </section>
  `,
  styles: [`
    :host{display:block}.clocks{display:grid;gap:1rem}.japan-date{margin:0;color:var(--wine);font-family:var(--font-display);font-size:1.15rem;text-align:center}
    .clock-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem}article{display:flex;align-items:center;gap:.75rem;padding:1rem;border:1px solid var(--border);border-radius:12px;background:#fffdf8}
    .flag{font-size:1.55rem}h3{margin:0;color:var(--text-muted);font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}article p{margin:.25rem 0;color:var(--ink);font-family:var(--font-display);font-size:clamp(1.3rem,5vw,2rem);line-height:1.1}small{color:var(--text-muted);font-size:.56rem}
    .clock-note{margin:0;color:var(--text-secondary);font-size:.75rem;line-height:1.6;text-align:center}@media(max-width:420px){.clock-row{grid-template-columns:1fr}}
  `]
})
export class TwoClocksComponent {
  protected readonly time = inject(HouseTimeService);
}
