import { Component, input } from '@angular/core';
import { TranslationKey } from '../../core/i18n/i18n.service';
import { RoundIcon } from './round-icon';
import { T } from './t';

/** Portage de components/HowStep.js. */
@Component({
  selector: 'bb-how-step',
  imports: [RoundIcon, T],
  template: `
    <div class="step">
      <bb-round-icon [text]="number()" [background]="background()" [color]="color()" />
      <div class="text">
        <span class="bb-card-title"><bb-t [key]="titleKey()" /></span>
        <span class="bb-card-subtitle"><bb-t [key]="subtitleKey()" /></span>
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
  /** Cles de traduction : rendues par `bb-t`, de taille stable d'une langue a
   * l'autre — sans quoi l'etape change de hauteur et decale la carte. */
  readonly titleKey = input.required<TranslationKey>();
  readonly subtitleKey = input.required<TranslationKey>();
  readonly color = input('var(--bb-primary)');
  readonly background = input('var(--bb-cyan-a10)');
}
