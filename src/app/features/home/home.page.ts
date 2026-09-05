import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BirthdayJourneyService } from '../../core/services/birthday-journey.service';
import { BirthdayExperienceComponent } from '../birthday/birthday-experience.component';
import { BirthdayHomeComponent } from '../birthday/birthday-home.component';

@Component({
  standalone: true,
  imports: [BirthdayExperienceComponent, BirthdayHomeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showBirthdayExperience) {
      <app-birthday-experience />
    } @else {
      <app-birthday-home />
    }
  `
})
export class HomePage {
  private readonly journey = inject(BirthdayJourneyService);
  protected readonly showBirthdayExperience = !this.journey.hasSeenThisSession();
}
