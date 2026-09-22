import { computed, effect, inject, Service, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GraphQlError } from './api/graphql.client';
import { UsersService } from './api/users.service';
import { AuthService } from './auth/auth.service';
import { ConfirmService } from './confirm.service';
import { I18nService } from './i18n/i18n.service';

/**
 * Annonces mises de cote par le membre connecte.
 *
 * Seuls les identifiants vivent ici (userservice) ; les annonces elles-memes
 * sont relues dans tripservice quand on ouvre la page des favoris, pour qu'un
 * prix change ou une annonce epuisee ne soient jamais montres perimes.
 *
 * Le coeur bascule tout de suite (mise a jour optimiste) : attendre la reponse
 * donnerait l'impression d'un clic rate. En cas d'echec il revient a son etat,
 * et on le dit.
 */
@Service()
export class FavoritesService {
  private readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly confirm = inject(ConfirmService);
  private readonly i18n = inject(I18nService);

  /** Identifiants, du plus recent au plus ancien. */
  readonly ids = signal<readonly string[]>([]);
  /** Faux tant que la liste n'a pas ete lue : la page des favoris attend ce signal. */
  readonly loaded = signal(false);

  constructor() {
    effect(() => {
      const signedIn = this.auth.isSignedIn();
      untracked(() => {
        if (signedIn) {
          this.load();
        } else {
          this.ids.set([]);
          this.loaded.set(false);
        }
      });
    });
  }

  /**
   * La meme liste en ensemble : chaque carte de l'accueil teste son appartenance,
   * et un clic sur un coeur les fait toutes recalculer.
   */
  private readonly idSet = computed(() => new Set(this.ids()));

  has(listingId: string | undefined): boolean {
    return !!listingId && this.idSet().has(listingId);
  }

  load(): void {
    this.users.favoriteListingIds().subscribe({
      next: (ids) => {
        this.ids.set(ids);
        this.loaded.set(true);
      },
      // Sans la liste, aucun coeur n'est plein : c'est l'etat le moins trompeur.
      error: () => this.loaded.set(true),
    });
  }

  async toggle(listingId: string): Promise<void> {
    const wasFavorite = this.has(listingId);
    this.ids.update((ids) =>
      wasFavorite ? ids.filter((id) => id !== listingId) : [listingId, ...ids],
    );
    try {
      await firstValueFrom(
        wasFavorite
          ? this.users.removeFavoriteListing(listingId)
          : this.users.addFavoriteListing(listingId),
      );
    } catch (cause) {
      this.ids.update((ids) =>
        wasFavorite ? [listingId, ...ids] : ids.filter((id) => id !== listingId),
      );
      const tooMany = cause instanceof GraphQlError && cause.code === 'too_many_favorites';
      this.confirm.inform(
        this.i18n.t('error'),
        this.i18n.t(tooMany ? 'error_too_many_favorites' : 'error_favorite_failed'),
      );
    }
  }
}
