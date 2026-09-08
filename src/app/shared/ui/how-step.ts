import { Component, input } from '@angular/core';
import { RoundIcon } from './round-icon';

/** Portage de components/HowStep.js. */
@Component({
  selector: 'bb-how-step',
  imports: [RoundIcon],
  template: `
    <div class="step">
      <bb-round-icon [text]="number()" [background]="background()" [color]="color()" />
      <div class="text">
        <span class="bb-card-title">{{ title() }}</span>
        <span class="bb-card-subtitle">{{ subtitle() }}</span>
      </div>
    </div>
  `,
  styles: `
    .step {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
  `,
})
export class HowStep {
  readonly number = input.required<number>();
  readonly title = input('');
  readonly subtitle = input('');
  readonly color = input('var(--bb-primary)');
  readonly background = input('var(--bb-cyan-a10)');
}
