import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BirthdayExperienceComponent } from './birthday-experience.component';

@Component({
  standalone: true,
  imports: [BirthdayExperienceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-birthday-experience />`
})
export class BirthdayPage {}
