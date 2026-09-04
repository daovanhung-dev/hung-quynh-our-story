import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/constants/site.config';
import { MemoryService } from '../../core/services/memory.service';
import { WelcomeOverlayComponent } from '../../shared/components/welcome-overlay/welcome-overlay.component';

@Component({
  standalone: true,
  imports: [RouterLink, WelcomeOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-welcome-overlay [title]="site.title" [subtitle]="site.welcomeSubtitle" />

    <section class="hero">
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Hùng ♡ Quỳnh</p>
          <h1>{{ site.subtitle }}</h1>
          <p class="intro">{{ site.intro }}</p>

          <div class="hero-actions">
            <a class="primary" routerLink="/timeline">Xem dòng thời gian</a>
            <a class="ghost" href="#features">Khám phá chức năng</a>
          </div>
        </div>

        <div class="hero-preview">
          <p class="preview-label">Những điều website này sẽ làm cho em</p>
          <ul>
            <li>Xem ảnh theo dòng thời gian và theo từng tháng.</li>
            <li>Kéo vuốt thanh ảnh ngang thật mượt để xem lại từng ngày.</li>
            <li>Mở từng bộ ảnh toàn màn hình để nhìn thật rõ.</li>
            <li>Đi nhanh tới các năm, các tháng hoặc những ảnh gần đây.</li>
          </ul>
        </div>
      </div>
    </section>

    <section id="features" class="features">
      <div class="section-copy">
        <p class="eyebrow">Nhiều chức năng hơn</p>
        <h2>Những tính năng mình nên có ngay từ đầu</h2>
      </div>

      <div class="feature-grid">
        @for (item of recommendedFeatures; track item.title) {
          <article class="feature-card">
            <span>{{ item.icon }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </article>
        }
      </div>
    </section>

    <section class="latest">
      <div class="section-copy">
        <p class="eyebrow">Ảnh gần đây</p>
        <h2>Những khoảnh khắc mới nhất</h2>
      </div>

      @if (latestPhotos().length === 0) {
        <div class="empty-state">
          <span>♡</span>
          <h3>Chúng mình vẫn còn rất nhiều kỷ niệm đang chờ được viết tiếp.</h3>
          <p>Hiện tại dự án vẫn chưa có ảnh đã import vào cấu trúc <code>public/images/memories/YYYY/MM/DD</code>.</p>
        </div>
      } @else {
        <div class="latest-grid">
          @for (photo of latestPhotos(); track photo.id) {
            <a class="latest-card" [routerLink]="['/memory', photo.memoryId]">
              <div class="thumb">
                <img [src]="photo.src" [alt]="photo.alt || photo.title || 'Ảnh kỷ niệm'" loading="lazy" decoding="async">
              </div>
              <strong>{{ photo.monthLabel }}</strong>
              <span>{{ formatDayMonth(photo.date) }}</span>
            </a>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }

    .hero {
      min-height: calc(100dvh - 64px);
      display: grid;
      align-items: center;
      padding: 2rem 0 4rem;
    }

    .hero-grid,
    .features,
    .latest {
      width: min(1180px, 90vw);
      margin: 0 auto;
    }

    .hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr);
      gap: 1.4rem;
      align-items: stretch;
    }

    .hero-copy,
    .hero-preview,
    .feature-card,
    .latest-card,
    .empty-state {
      border: 1px solid var(--border);
      border-radius: calc(var(--radius-xl) + 4px);
      background: color-mix(in srgb, var(--surface) 92%, transparent);
      box-shadow: var(--shadow-soft);
    }

    .hero-copy {
      padding: clamp(2rem, 5vw, 4rem);
      background:
        radial-gradient(circle at 0 0, rgba(185,120,130,.12), transparent 28%),
        radial-gradient(circle at 100% 100%, rgba(132,96,133,.1), transparent 30%),
        color-mix(in srgb, var(--surface) 94%, transparent);
    }

    .hero-preview { padding: 1.5rem; }
    .preview-label,
    .eyebrow { margin: 0 0 .8rem; color: var(--accent-deep); font-size: .78rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
    h1 { margin: 0; font-family: var(--font-display); font-size: clamp(3rem, 8vw, 6.3rem); line-height: .92; letter-spacing: -.05em; }
    .intro { max-width: 760px; margin: 1.2rem 0 0; color: var(--text-secondary); font-size: 1.04rem; line-height: 1.8; }

    .hero-actions { display: flex; flex-wrap: wrap; gap: .9rem; margin-top: 1.7rem; }
    .hero-actions a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 46px;
      padding: .8rem 1.1rem;
      border-radius: 999px;
      text-decoration: none;
    }
    .primary { background: var(--accent-deep); color: white; }
    .ghost { border: 1px solid var(--border); color: var(--text-secondary); background: var(--surface); }

    .hero-preview ul { margin: 1rem 0 0; padding-left: 1.1rem; color: var(--text-secondary); line-height: 1.8; }

    .features,
    .latest { padding: 2rem 0 4rem; }
    .section-copy { max-width: 780px; margin-bottom: 1.4rem; }
    h2 { margin: 0; font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 4.2rem); line-height: .96; letter-spacing: -.04em; }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
    }

    .feature-card { padding: 1.3rem; }
    .feature-card span { font-size: 1.4rem; }
    .feature-card h3 { margin: .9rem 0 .5rem; font-family: var(--font-display); font-size: 1.5rem; }
    .feature-card p { margin: 0; color: var(--text-secondary); line-height: 1.7; }

    .latest-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 1rem;
    }

    .latest-card {
      display: grid;
      gap: .55rem;
      padding: .65rem;
      color: inherit;
      text-decoration: none;
    }
    .latest-card .thumb {
      overflow: hidden;
      aspect-ratio: 4 / 5;
      border-radius: 18px;
      background: var(--surface-muted);
    }
    .latest-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 320ms var(--ease-soft); }
    .latest-card:hover img { transform: scale(1.03); }
    .latest-card strong { font-size: .88rem; }
    .latest-card span { color: var(--text-muted); font-size: .8rem; }

    .empty-state {
      display: grid;
      place-items: center;
      min-height: 220px;
      padding: 2rem 1rem;
      text-align: center;
    }
    .empty-state span { color: var(--accent); font-size: 2rem; }
    .empty-state h3 { max-width: 700px; margin: .8rem 0; font-family: var(--font-display); font-size: clamp(1.6rem, 4vw, 2.3rem); }
    .empty-state p { max-width: 700px; margin: 0; color: var(--text-muted); line-height: 1.7; }
    code { padding: .15rem .35rem; border-radius: 8px; background: var(--surface-muted); }

    @media (max-width: 1024px) {
      .hero-grid { grid-template-columns: 1fr; }
      .feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .latest-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    @media (max-width: 680px) {
      .hero-grid, .features, .latest { width: calc(100% - 2rem); }
      .feature-grid, .latest-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class HomePage {
  private readonly memoryService = inject(MemoryService);

  protected readonly site = SITE_CONFIG;
  protected readonly latestPhotos = computed(() => this.memoryService.getLatestPhotos(10));
  protected readonly recommendedFeatures = [
    {
      icon: '✦',
      title: 'Xem theo dòng thời gian',
      description: 'Đây là chức năng chính: ảnh được nhóm theo tháng, xem lại hành trình của hai đứa theo đúng thứ tự thời gian.'
    },
    {
      icon: '↔',
      title: 'Thanh ảnh ngang có thể kéo vuốt',
      description: 'Mỗi tháng là một thanh ảnh ngang. Có thể kéo bằng chuột, vuốt bằng tay và bấm nút trái phải để trượt thật mượt.'
    },
    {
      icon: '◱',
      title: 'Mở ảnh toàn màn hình',
      description: 'Khi muốn nhìn thật rõ, em chỉ cần bấm vào bộ kỷ niệm để vào gallery và xem ảnh fullscreen.'
    },
    {
      icon: '⌘',
      title: 'Đi nhanh theo năm, theo tháng',
      description: 'Có điều hướng nhanh để nhảy tới đúng năm hoặc đúng tháng, không cần cuộn quá lâu.'
    },
    {
      icon: '♥',
      title: 'Khoảnh khắc gần đây',
      description: 'Ngay ở trang đầu luôn có một dải ảnh mới nhất để mình mở lại những kỷ niệm gần đây nhanh hơn.'
    },
    {
      icon: '✧',
      title: 'Sẵn sàng mở rộng thêm',
      description: 'Sau này có thể thêm ngày đặc biệt, ảnh random, video, thư tay, nhạc nền hoặc “ngày này năm xưa”.'
    }
  ];

  protected formatDayMonth(date: string): string {
    return this.memoryService.formatDayMonth(date);
  }
}
