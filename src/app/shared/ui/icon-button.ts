import { Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

/** Portage de components/ButtonIcon.js : carre 40px, radius 16. */
@Component({
  selector: 'bb-icon-button',
  imports: [Icon],
  template: `
    <button
      type="button"
      [attr.aria-label]="label()"
      [attr.title]="label()"
      (click)="pressed.emit()"
    >
      <bb-icon [name]="icon()" [size]="iconSize()" />
    </button>
  `,
  styles: `
    button {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: var(--bb-radius);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--bb-cyan-a10);
      color: var(--bb-primary);
      transition: background 0.15s ease;
    }

    button:hover {
      background: var(--bb-cyan-a20);
    }

    :host([data-variant='ghost']) button {
      background: transparent;
      color: var(--bb-title);
    }

    :host([data-variant='ghost']) button:hover {
      background: var(--bb-cyan-a10);
    }

    :host([data-variant='danger']) button {
      background: var(--bb-red-a10);
      color: var(--bb-error);
    }

    :host([data-variant='on-gradient']) button {
      background: rgba(0, 0, 0, 0.18);
      color: var(--bb-white);
    }
  `,
})
export class IconButton {
  readonly icon = input.required<IconName>();
  /** Nom accessible : ces boutons n'ont pas de texte visible. */
  readonly label = input.required<string>();
  readonly iconSize = input(20);
  readonly pressed = output<void>();
}
