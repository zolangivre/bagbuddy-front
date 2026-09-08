import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

/** Portage de components/StatCard.js (bandeau de stats des en-tetes). */
@Component({
  selector: 'bb-stat-card',
  imports: [Icon],
  template: `
    <div class="stat" [style.background]="background()" [style.border-color]="borderColor()">
      <bb-icon [name]="icon()" [size]="20" [style.color]="iconColor()" />
      <span class="bb-stat-value" [style.color]="valueColor()">{{ value() }}</span>
      <span class="label" [style.color]="labelColor()">{{ label() }}</span>
    </div>
  `,
  styles: `
    .stat {
      flex: 1;
      min-width: 0;
      padding: 10px;
      border-radius: var(--bb-radius);
      border: 1px solid transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-align: center;
    }

    bb-icon {
      margin-bottom: 4px;
    }

    .label {
      font-size: var(--bb-fs-body-3);
    }
  `,
})
export class StatCard {
  readonly icon = input.required<IconName>();
  readonly value = input<string>('');
  readonly label = input('');
  readonly background = input('rgba(0, 0, 0, 0.15)');
  readonly borderColor = input('transparent');
  readonly iconColor = input('var(--bb-white)');
  readonly valueColor = input('var(--bb-white)');
  readonly labelColor = input('var(--bb-very-light-grey)');
}
