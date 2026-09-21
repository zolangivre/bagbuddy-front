import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import { LoadErrorKey, loadErrorKey } from '../../core/api/load-error';
import { TripSearchOverview, TripsService } from '../../core/api/trips.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyService } from '../../core/currency.service';
import { initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Listing, ListingFilters, SortOption } from '../../core/models';
import { Avatar } from '../../shared/ui/avatar';
import { Filters } from '../../shared/ui/filters';
import { LoadError } from '../../shared/ui/load-error';
import { Loader } from '../../shared/ui/loader';
import { PageHeader } from '../../shared/ui/page-header';
import { RevealMore } from '../../shared/ui/reveal-more';
import { ResultsHeader } from '../../shared/ui/results-header';
import { Segmented, SegmentedOption } from '../../shared/ui/segmented';
import { SortSelect } from '../../shared/ui/sort-select';
import { StatCard } from '../../shared/ui/stat-card';
import { AlertCta } from './alert-cta';
import { HomeCard } from './home-card';
import { SellView } from './sell-view';

/** Annonces demandees par page a searchTrips, a chaque approche du bas de liste. */
const LISTINGS_PAGE_SIZE = 20;

/** Portage de app/(tabs)/home.js, remis en gabarit rail + resultats. */
@Component({
  selector: 'bb-home-page',
  imports: [
    PageHeader,
    StatCard,
    Avatar,
    Filters,
    Segmented,
    SortSelect,
    ResultsHeader,
    HomeCard,
    SellView,
    Loader,
    LoadError,
    RevealMore,
    AlertCta,
  ],
  template: `
    <bb-page-header
      [title]="i18n.t('welcome_back', { name: firstName() })"
      [subtitle]="i18n.t('find_luggage_space')"
    >
      <div class="bb-stat-row">
        <bb-stat-card
          icon="plane"
          [value]="overview() ? overview()!.totalCount.toString() : '–'"
          labelKey="active_routes"
        />
        <bb-stat-card
          icon="weight"
          [value]="overview() ? overview()!.totalRemainingWeight + ' kg' : '–'"
          labelKey="available_weight"
        />
        <bb-stat-card
          icon="trending-up"
          [value]="overview() ? currency.format(overview()!.averagePricePerKg ?? 0) : '–'"
          labelKey="avg_price"
        />
      </div>

      <bb-avatar
        slot="aside"
        [initials]="initials()"
        [size]="48"
        background="rgba(255, 255, 255, 0.22)"
        color="var(--bb-white)"
        borderColor="rgba(255, 255, 255, 0.5)"
      />
    </bb-page-header>

    <div class="bb-page switcher">
      <bb-segmented [options]="modes()" [(value)]="mode" [label]="i18n.t('home')" />
    </div>

    <div class="bb-page content">
      @if (mode() === 'buy') {
        <div class="bb-with-rail">
          <bb-filters [(filters)]="filters" />

          <section>
            <bb-results-header [label]="resultsLabel()">
              <bb-sort-select [sort]="sort()" (sortChange)="onSortChange($event)" />
            </bb-results-header>

            <bb-alert-cta class="alert-cta" [filters]="filters()" />

            @if (loading()) {
              <bb-loader [label]="i18n.t('loading')" />
            } @else if (loadError(); as error) {
              <bb-load-error [messageKey]="error" (retry)="reload()" />
            } @else if (listings().length) {
              <div class="list" [attr.aria-busy]="loadingMore()">
                @for (listing of listings(); track listing.id) {
                  <bb-home-card [item]="listing" />
                }
              </div>
              @if (hasMore()) {
                <bb-reveal-more [count]="listings().length" (reached)="loadMore()" />
              }
            } @else {
              <p class="bb-empty">{{ i18n.t('no_results_found') }}</p>
            }
          </section>
        </div>
      } @else {
        <bb-sell-view />
      }
    </div>
  `,
  styles: `
    .switcher {
      padding-top: 20px;
    }

    /* Sur mobile le selecteur prend toute la largeur ; sur un grand ecran il
       n'a pas besoin de plus que son contenu. */
    .switcher bb-segmented {
      display: block;
      max-width: 460px;
    }

    .content {
      padding-top: 20px;
      padding-bottom: 48px;
    }

    .alert-cta {
      display: block;
      margin-bottom: 16px;
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `,
})
export class HomePage {
  protected readonly i18n = inject(I18nService);
  protected readonly currency = inject(CurrencyService);
  private readonly trips = inject(TripsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);

  /** Pages deja recues pour le filtre courant, dans l'ordre du serveur. */
  protected readonly listings = signal<Listing[]>([]);
  /** Nombre de resultats du filtre courant, toutes pages confondues. */
  protected readonly totalCount = signal(0);
  /** Chiffres du bandeau : toutes les annonces reservables, sans filtre. */
  protected readonly overview = signal<TripSearchOverview | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly loadError = signal<LoadErrorKey | null>(null);
  protected readonly mode = signal('buy');
  protected readonly filters = signal<ListingFilters>({});

  protected readonly sort = computed(() => this.filters().sort ?? null);

  protected readonly modes = computed<SegmentedOption[]>(() => [
    {
      key: 'buy',
      labelKey: 'buy_weight',
      icon: 'weight',
      color: 'var(--bb-primary-strong)',
    },
    {
      key: 'sell',
      labelKey: 'sell_weight',
      icon: 'plus',
      color: 'var(--bb-success-strong)',
    },
  ]);

  /**
   * Faux pendant le chargement et apres un echec : le compteur ne dit alors rien
   * plutot que « 0 trajet », qui se lirait comme un resultat.
   */
  protected readonly loaded = computed(() => !this.loading() && !this.loadError());

  protected readonly hasMore = computed(() => this.listings().length < this.totalCount());

  protected readonly firstName = computed(() => this.auth.userInfo()?.given_name ?? '');
  protected readonly initials = computed(() => initialsOf(this.auth.userInfo()?.name, '?'));

  protected readonly resultsLabel = computed(() => {
    // Espace insecable : la ligne garde sa hauteur sans rien annoncer.
    if (!this.loaded()) return '\u00a0';
    const count = this.totalCount();
    return this.i18n.t(count > 1 ? 'results_count' : 'results_count_one', { count });
  });

  /** Incremente a chaque nouveau filtre : une page arrivee en retard pour l'ancien est ignoree. */
  private generation = 0;

  /**
   * Filtres, tri et pagination sont faits par searchTrips. Un changement de
   * filtre repart de la premiere page (switchMap annule la requete precedente) ;
   * le bandeau, lui, ne depend pas du filtre et n'est lu qu'au premier passage.
   */
  constructor() {
    toObservable(this.filters)
      .pipe(
        switchMap((filters) => this.firstPage(filters)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected onSortChange(sort: SortOption | null): void {
    this.filters.update((current) => ({ ...current, sort }));
  }

  protected reload(): void {
    this.firstPage(this.filters()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;
    const generation = this.generation;
    this.loadingMore.set(true);
    this.trips
      .search(this.filters(), LISTINGS_PAGE_SIZE, this.listings().length, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ results }) => {
          if (generation !== this.generation) return;
          // Une annonce publiee entre deux pages decale l'offset d'une ligne : on
          // ecarte le doublon plutot que d'afficher deux fois la meme carte.
          this.listings.update((shown) => {
            const ids = new Set(shown.map((listing) => listing.id));
            return shown.concat(results.items.filter((listing) => !ids.has(listing.id)));
          });
          this.totalCount.set(results.totalCount);
          this.loadingMore.set(false);
        },
        // La page deja affichee reste ; la sentinelle redemandera au prochain defilement.
        error: () => this.loadingMore.set(false),
      });
  }

  private firstPage(filters: ListingFilters) {
    const generation = ++this.generation;
    this.loading.set(true);
    this.loadingMore.set(false);
    this.loadError.set(null);
    return this.trips.search(filters, LISTINGS_PAGE_SIZE, 0, !this.overview()).pipe(
      tap(({ overview, results }) => {
        if (generation !== this.generation) return;
        if (overview) this.overview.set(overview);
        this.listings.set(results.items);
        this.totalCount.set(results.totalCount);
        this.loading.set(false);
      }),
      catchError((error) => {
        if (generation === this.generation) {
          this.loadError.set(loadErrorKey(error));
          this.loading.set(false);
        }
        return EMPTY;
      }),
    );
  }
}
