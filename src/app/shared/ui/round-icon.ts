import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

/** Portage de components/RoundIconText.js : pastille ronde icone ou chiffre. */
@Component({
  selector: 'bb-round-icon',
  imports: [Icon],
  template: `
    <span
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.background]="background()"
      [style.color]="color()"
    >
      @if (icon(); as iconName) {
        <bb-icon [name]="iconName" [size]="size() * 0.5" />
      } @else {
        <span class="text">{{ text() }}</span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }

    span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
    }

    .text {
      font-size: 0.875rem;
      font-weight: 700;
    }
  `,
})
export class RoundIcon {
  readonly icon = input<IconName | null>(null);
  readonly text = input<string | number>('');
  readonly size = input(32);
  readonly background = input('var(--bb-cyan-a10)');
  readonly color = input('var(--bb-primary)');
}
