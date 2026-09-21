import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { LoadErrorKey, loadErrorKey } from '../../core/api/load-error';
import { TripsService } from '../../core/api/trips.service';
import { FavoritesService } from '../../core/favorites.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Listing } from '../../core/models';
import { LoadError } from '../../shared/ui/load-error';
import { Loader } from '../../shared/ui/loader';
import { SubHeader } from '../../shared/ui/sub-header';
import { HomeCard } from '../home/home-card';

/**
 * Annonces mises de cote. Les identifiants viennent de userservice, les
 * annonces de tripservice (`tripsByIds`), relues a chaque visite.
 *
 * Une annonce partie ou epuisee reste dans la liste, en bas et sans action :
 * la retirer en silence ferait croire a un favori perdu. Retirer le coeur la
 * retire de la page sur-le-champ.
 */
@Component({
  selector: 'bb-favorites-page',
  imports: [SubHeader, HomeCard, Loader, LoadError],
  template: `
    <bb-sub-header [title]="i18n.t('my_favorites')" (back)="goBack()" />

    <div class="bb-page content">
      @if (loading()) {
        <bb-loader [label]="i18n.t('loading')" />
      } @else if (loadError(); as error) {
        <bb-load-error [messageKey]="error" (retry)="load()" />
      } @else if (!shown().length) {
        <p class="bb-empty">{{ i18n.t('no_favorites') }}</p>
      } @else {
        <div class="list">
          @for (listing of bookable(); track listing.id) {
            <bb-home-card [item]="listing" />
          }
        </div>

        @if (gone().length) {
          <h2 class="bb-section-title gone-title">{{ i18n.t('favorites_unavailable') }}</h2>
          <div class="list gone">
            @for (listing of gone(); track listing.id) {
              <bb-home-card [item]="listing" [bookable]="false" />
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    .content {
      padding-top: 24px;
      padding-bottom: 48px;
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .gone-title {
      margin: 32px 0 12px;
    }

    /* Estompee mais lisible : le texte garde son contraste, seul le fond recule. */
    .gone bb-home-card {
      filter: saturate(0.4);
    }
  `,
})
export class FavoritesPage {
  protected readonly i18n = inject(I18nService);
  private readonly favorites = inject(FavoritesService);
  private readonly trips = inject(TripsService);
  private readonly router = inject(Router);

  private readonly listings = signal<Listing[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<LoadErrorKey | null>(null);

  /** Suit le coeur : une annonce retiree des favoris quitte la page tout de suite. */
  protected readonly shown = computed(() =>
    this.listings().filter((listing) => this.favorites.has(listing.id)),
  );

  protected readonly bookable = computed(() => this.shown().filter(isBookable));
  protected readonly gone = computed(() => this.shown().filter((listing) => !isBookable(listing)));

  constructor() {
    // La liste des identifiants arrive apres la connexion : on attend qu'elle soit lue.
    effect(() => {
      if (this.favorites.loaded()) untracked(() => this.load());
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.trips.byIds(this.favorites.ids()).subscribe({
      next: (listings) => {
        this.listings.set(listings);
        this.loading.set(false);
      },
      error: (error) => {
        this.loadError.set(loadErrorKey(error));
        this.loading.set(false);
      },
    });
  }

  protected goBack(): void {
    history.length > 1 ? history.back() : void this.router.navigate(['/profile']);
  }
}

/** Meme regle que activeTrips : de la place et un depart a venir. */
function isBookable(listing: Listing): boolean {
  return listing.remainingWeight > 0 && new Date(listing.departureDate).getTime() > Date.now();
}
