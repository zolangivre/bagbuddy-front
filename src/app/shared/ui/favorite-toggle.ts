import { Component, computed, inject, input } from '@angular/core';
import { FavoritesService } from '../../core/favorites.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../icon/icon';

/**
 * Coeur « mettre de cote » d'une annonce.
 *
 * Bouton a bascule (`aria-pressed`) a libelle fixe : c'est l'etat « enfonce »
 * qui dit si l'annonce est en favori, pas un libelle qui changerait avec lui —
 * « Retirer des favoris, enfonce » ne voudrait rien dire. Le coeur se remplit
 * quand il est actif, pour ne pas reposer sur la seule couleur.
 */
@Component({
  selector: 'bb-favorite-toggle',
  imports: [Icon],
  template: `
    <button
      type="button"
      [attr.aria-pressed]="active()"
      [attr.aria-label]="i18n.t('favorite')"
      [attr.title]="i18n.t('favorite')"
      (click)="favorites.toggle(listingId())"
    >
      <!-- Plein quand actif : la forme change, pas seulement la couleur. -->
      <bb-icon name="heart" [size]="20" [fill]="active() ? 'currentColor' : 'none'" />
    </button>
  `,
  styles: `
    button {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: var(--bb-radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      color: var(--bb-text);
      transition: background 0.15s ease;
    }

    button:hover {
      background: var(--bb-red-a10);
      color: var(--bb-error);
    }

    button[aria-pressed='true'] {
      color: var(--bb-error);
    }
  `,
})
export class FavoriteToggle {
  protected readonly i18n = inject(I18nService);
  protected readonly favorites = inject(FavoritesService);

  readonly listingId = input.required<string>();
  protected readonly active = computed(() => this.favorites.has(this.listingId()));
}
