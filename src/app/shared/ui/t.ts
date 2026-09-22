import { Component, computed, inject, input } from '@angular/core';
import { I18nService, Language, TranslationKey } from '../../core/i18n/i18n.service';

/**
 * Libelle traduit qui **ne change pas de taille avec la langue**.
 *
 * Un texte francais est plus long que son equivalent anglais : un onglet, un
 * bouton ou une pastille dimensionnes sur leur libelle se redimensionnent donc
 * au changement de langue, et poussent tout ce qui les entoure. Ici toutes les
 * traductions sont rendues dans la meme cellule de grille, les inactives en
 * `visibility: hidden` — la boite prend la largeur de la plus longue et ne
 * bouge plus, seul le texte visible change.
 *
 * `visibility: hidden` sort les variantes de l'arbre d'accessibilite, de la
 * recherche dans la page et de la selection : un lecteur d'ecran n'entend que
 * la langue courante.
 *
 * A reserver aux libelles qui dimensionnent un element (navigation, boutons,
 * onglets) : dans un paragraphe ou un titre pleine largeur, la boite est deja
 * stable et `{{ i18n.t('cle') }}` suffit.
 */
@Component({
  selector: 'bb-t',
  template: `
    @for (variant of variants(); track variant.language + ':' + variant.key) {
      <span [class.shown]="variant.language === i18n.language() && variant.key === key()">{{
        variant.text
      }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-grid;
      grid-template-areas: 'label';
    }

    span {
      grid-area: label;
      visibility: hidden;
      white-space: inherit;
    }

    span.shown {
      visibility: visible;
    }
  `,
})
export class T {
  protected readonly i18n = inject(I18nService);

  readonly key = input.required<TranslationKey>();
  readonly params = input<Record<string, string | number>>();
  /**
   * Toutes les cles que le libelle peut afficher, pour un libelle qui alterne
   * en cours de route — « Enregistrer » / « Enregistrement… » sur un bouton
   * d'envoi. Y figurer ou non pour `key` est indifferent.
   */
  readonly reserve = input<readonly TranslationKey[]>([]);

  /**
   * Ordre fixe (la reserve d'abord) et sans doublon : changer de langue ou de
   * cle ne fait que deplacer la classe `shown`, sans remonter les spans.
   */
  protected readonly variants = computed(() => {
    const params = this.params();
    const keys = [...new Set([...this.reserve(), this.key()])];
    return this.i18n.languages.flatMap((language: Language) =>
      keys.map((key) => ({ language, key, text: this.i18n.translateIn(language, key, params) })),
    );
  });
}
