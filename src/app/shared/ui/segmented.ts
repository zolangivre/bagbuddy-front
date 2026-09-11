import { Component, input, model } from '@angular/core';
import { TranslationKey } from '../../core/i18n/i18n.service';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';
import { T } from './t';

export interface SegmentedOption {
  key: string;
  /** Cle de traduction : rendue par `bb-t`, donc de largeur stable. */
  labelKey: TranslationKey;
  icon?: IconName;
  color: string;
}

/**
 * Portage de components/ActionButton.js : barre de segments posee sur une carte,
 * segment actif colore.
 */
@Component({
  selector: 'bb-segmented',
  imports: [Icon, T],
  template: `
    <div class="bar" role="tablist" [attr.aria-label]="label()">
      @for (option of options(); track option.key) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="value() === option.key"
          [class.active]="value() === option.key"
          [style.background]="value() === option.key ? option.color : 'transparent'"
          (click)="value.set(option.key)"
        >
          @if (option.icon; as icon) {
            <bb-icon [name]="icon" [size]="20" />
          }
          <bb-t [key]="option.labelKey" />
        </button>
      }
    </div>
  `,
  styles: `
    .bar {
      display: flex;
      gap: 8px;
      padding: 8px;
      border-radius: var(--bb-radius);
      background: var(--bb-card);
      box-shadow: var(--bb-shadow-raised);
    }

    button {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 14px;
      border: none;
      border-radius: var(--bb-radius);
      background: transparent;
      color: var(--bb-segment-idle);
      font-size: var(--bb-fs-body-2);
      font-weight: 500;
      transition:
        background 0.15s ease,
        color 0.15s ease;
    }

    button:hover:not(.active) {
      background: var(--bb-cyan-a10);
    }

    button.active {
      color: var(--bb-white);
      box-shadow: 0 5px 8px rgba(0, 0, 0, 0.05);
    }
  `,
})
export class Segmented {
  readonly options = input.required<SegmentedOption[]>();
  readonly value = model.required<string>();
  readonly label = input('');
}
