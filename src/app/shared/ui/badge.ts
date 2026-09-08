import { Component, input } from '@angular/core';

/** Portage de components/Label.js : pastille arrondie icone + texte. */
@Component({
  selector: 'bb-badge',
  template: `
    <span
      [style.background]="background()"
      [style.border-color]="borderColor()"
      [style.color]="color()"
    >
      <ng-content />
      {{ text() }}
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid transparent;
      font-size: var(--bb-fs-body-3);
      font-weight: 500;
      white-space: nowrap;
    }
  `,
})
export class Badge {
  readonly text = input('');
  readonly background = input('var(--bb-cyan-a10)');
  readonly borderColor = input('transparent');
  readonly color = input('var(--bb-primary)');
}
