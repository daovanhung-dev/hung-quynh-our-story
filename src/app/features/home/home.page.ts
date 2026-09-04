import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BirthdayJourneyService } from '../../core/services/birthday-journey.service';
import { BirthdayExperienceComponent } from '../birthday/birthday-experience.component';

@Component({
  standalone: true,
  imports: [BirthdayExperienceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showBirthdayExperience) {
      <app-birthday-experience />
    } @else {
      <div class="home-redirect" aria-live="polite">Đang mở những kỷ niệm của chúng mình…</div>
    }
  `,
  styles: [`
    :host { display: block; }
    .home-redirect { display: grid; min-height: calc(100dvh - 64px); place-items: center; color: var(--text-muted); font-size: .9rem; }
  `]
})
export class HomePage implements OnInit {
  private readonly router = inject(Router);
  private readonly journey = inject(BirthdayJourneyService);

  protected readonly showBirthdayExperience = !this.journey.hasSeenThisSession();

  ngOnInit(): void {
    if (!this.showBirthdayExperience) {
      void this.router.navigateByUrl('/timeline', { replaceUrl: true });
    }
  }
}
