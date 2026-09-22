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
  /**
   * Par defaut un liseré tire du texte lui-meme : toutes les pastilles ont
   * ainsi le meme contour, quelle que soit leur teinte, sans avoir a le
   * repeter a chaque appel.
   */
  readonly borderColor = input('color-mix(in srgb, currentColor 22%, transparent)');
  readonly color = input('var(--bb-primary)');
}
