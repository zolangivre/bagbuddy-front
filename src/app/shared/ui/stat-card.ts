import { Component, input } from '@angular/core';
import { TranslationKey } from '../../core/i18n/i18n.service';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';
import { T } from './t';

/** Sur le bandeau degrade, sur une carte blanche, ou teinte par role. */
export type StatTone = 'inverse' | 'neutral' | 'primary' | 'success';

/**
 * `stack` : libelle au-dessus, valeur dessous, filet vertical — une rangee de
 * champs, pour un bandeau large. `inline` : libelle a gauche, valeur a droite,
 * filet horizontal — une liste de champs, pour une colonne etroite.
 */
export type StatLayout = 'stack' | 'inline';

/**
 * Un chiffre de tete, presente comme un champ de billet : libelle discret
 * au-dessus, valeur en gros dessous, filet vertical entre deux champs.
 *
 * Portage de components/StatCard.js. Le mobile empile icone / valeur / libelle
 * au centre d'une boite ; sur le web cette boite se voyait plus que son
 * contenu — fond sombre sur le degrade, libelle a la ligne, moitie de la
 * hauteur vide. On garde donc les donnees et on jette la boite : c'est la meme
 * grammaire que le talon de la carte d'embarquement (« Poids disponible » puis
 * « 20 kg »), et les chiffres reprennent la condensee a chasse fixe.
 *
 * Le composant est une cellule de `subgrid` : les libelles partagent une ligne
 * et les valeurs une autre, donc un libelle qui passe a deux lignes decale
 * toutes les valeurs ensemble au lieu de casser l'alignement. Le parent doit
 * poser la grille : la classe globale `.bb-stat-row` (styles.css).
 *
 * Les couleurs viennent de `tone` et non de cinq entrees de couleur : un role,
 * une declinaison, la meme partout.
 */
@Component({
  selector: 'bb-stat-card',
  imports: [Icon, T],
  host: { '[class]': 'tone() + " " + layout()' },
  template: `
    <span class="head">
      <bb-icon [name]="icon()" [size]="15" />
      <span class="label"><bb-t [key]="labelKey()" /></span>
    </span>
    <span class="value">{{ value() }}</span>
  `,
  styles: `
    :host(.stack) {
      display: grid;
      grid-row: span 2;
      grid-template-rows: subgrid;
      align-content: start;
      row-gap: 6px;
      padding: 2px 0 2px 18px;
      border-left: 1px solid var(--rule);
    }

    /* Le premier champ est cale sur le bord : un filet en tete de rangee
       ressemblerait a une troncature. */
    :host(.stack:first-of-type) {
      padding-left: 0;
      border-left: none;
    }

    /* Colonne etroite : une ligne par champ, separee par un filet. */
    :host(.inline) {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 0;
      border-top: 1px solid var(--rule);
    }

    :host(.inline:first-of-type) {
      padding-top: 0;
      border-top: none;
    }

    :host(.inline) .value {
      font-size: 1.375rem;
    }

    .head {
      display: flex;
      align-items: baseline;
      gap: 6px;
      min-width: 0;
      color: var(--label);
      font-size: var(--bb-fs-body-3);
    }

    bb-icon {
      flex: none;
      color: var(--accent);
      transform: translateY(2px);
    }

    .value {
      align-self: end;
      font-family: var(--bb-font-data);
      font-size: 1.75rem;
      font-weight: 600;
      line-height: 1.05;
      letter-spacing: 0.01em;
      font-variant-numeric: tabular-nums;
      color: var(--value);
    }

    /* Sur le bandeau degrade : blanc, filets translucides. Le libelle reste
       tres clair (0,92) et non gris : le degrade s'eclaircit vers la droite,
       ou les champs sont poses, et --bb-very-light-grey n'y tenait plus le
       4,5:1 des petits textes une fois la boite sombre supprimee. */
    :host(.inverse) {
      --rule: rgba(255, 255, 255, 0.32);
      --label: rgba(255, 255, 255, 0.92);
      --accent: rgba(255, 255, 255, 0.85);
      --value: var(--bb-white);
    }

    /* --bb-text et --bb-title suivent le theme ; --bb-text-grey et
       --bb-secondary, eux, ne sont pas redefinis en sombre et y deviendraient
       illisibles sur la carte. */
    :host(.neutral) {
      --rule: var(--bb-border);
      --label: var(--bb-text);
      --accent: var(--bb-title);
      --value: var(--bb-title);
    }

    :host(.primary) {
      --rule: var(--bb-border);
      --label: var(--bb-text);
      --accent: var(--bb-primary);
      --value: var(--bb-primary);
    }

    :host(.success) {
      --rule: var(--bb-border);
      --label: var(--bb-text);
      --accent: var(--bb-success);
      --value: var(--bb-success);
    }
  `,
})
export class StatCard {
  readonly icon = input.required<IconName>();
  readonly value = input<string>('');
  /**
   * Libelle par cle de traduction : passe par `bb-t`, qui reserve la place de
   * la plus longue langue — le champ ne change ni de largeur ni de hauteur
   * avec la langue.
   */
  readonly labelKey = input.required<TranslationKey>();
  readonly tone = input<StatTone>('inverse');
  readonly layout = input<StatLayout>('stack');
}
