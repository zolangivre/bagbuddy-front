import { Component, computed, inject, signal } from '@angular/core';
import { TripsService } from '../../core/api/trips.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyService } from '../../core/currency.service';
import { initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Listing, ListingFilters, SortOption } from '../../core/models';
import { Avatar } from '../../shared/ui/avatar';
import { Filters } from '../../shared/ui/filters';
import { Loader } from '../../shared/ui/loader';
import { PageHeader } from '../../shared/ui/page-header';
import { ResultsHeader } from '../../shared/ui/results-header';
import { Segmented, SegmentedOption } from '../../shared/ui/segmented';
import { SortSelect } from '../../shared/ui/sort-select';
import { StatCard } from '../../shared/ui/stat-card';
import { HomeCard } from './home-card';
import { SellView } from './sell-view';

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
  ],
  template: `
    <bb-page-header
      [title]="i18n.t('welcome_back', { name: firstName() })"
      [subtitle]="i18n.t('find_luggage_space')"
    >
      <div class="stats">
        <bb-stat-card
          icon="plane"
          [value]="listings().length.toString()"
          [label]="i18n.t('active_routes')"
        />
        <bb-stat-card
          icon="weight"
          [value]="totalWeight() + ' kg'"
          [label]="i18n.t('available_weight')"
        />
        <bb-stat-card
          icon="trending-up"
          [value]="currency.format(averagePrice())"
          [label]="i18n.t('avg_price')"
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

            @if (loading()) {
              <bb-loader [label]="i18n.t('loading')" />
            } @else if (visibleListings().length) {
              <div class="list">
                @for (listing of visibleListings(); track listing.id) {
                  <bb-home-card [item]="listing" />
                }
              </div>
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
    .stats {
      display: flex;
      gap: 12px;
    }

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
  private readonly auth = inject(AuthService);

  protected readonly listings = signal<Listing[]>([]);
  protected readonly loading = signal(false);
  protected readonly mode = signal('buy');
  protected readonly filters = signal<ListingFilters>({});

  protected readonly sort = computed(() => this.filters().sort ?? null);

  protected readonly modes = computed<SegmentedOption[]>(() => [
    {
      key: 'buy',
      label: this.i18n.t('buy_weight'),
      icon: 'weight',
      color: 'var(--bb-primary-strong)',
    },
    {
      key: 'sell',
      label: this.i18n.t('sell_weight'),
      icon: 'plus',
      color: 'var(--bb-success-strong)',
    },
  ]);

  protected readonly firstName = computed(() => this.auth.userInfo()?.given_name ?? '');
  protected readonly initials = computed(() => initialsOf(this.auth.userInfo()?.name, '?'));

  protected readonly totalWeight = computed(() =>
    this.listings().reduce((sum, item) => sum + item.remainingWeight, 0),
  );

  protected readonly averagePrice = computed(() => {
    const listings = this.listings();
    if (!listings.length) return 0;
    return listings.reduce((sum, item) => sum + item.pricePerKg, 0) / listings.length;
  });

  /** Meme logique de filtre et de tri que applyFilters() du mobile. */
  protected readonly visibleListings = computed(() => {
    const { from, to, minPrice, maxPrice, minWeight, maxWeight, sort } = this.filters();
    const filtered = this.listings().filter(
      (item) =>
        (!from || item.departureAirport === from) &&
        (!to || item.arrivalAirport === to) &&
        (minPrice === undefined || item.pricePerKg >= minPrice) &&
        (maxPrice === undefined || item.pricePerKg <= maxPrice) &&
        (minWeight === undefined || item.remainingWeight >= minWeight) &&
        (maxWeight === undefined || item.remainingWeight <= maxWeight),
    );

    const time = (value?: string) => (value ? new Date(value).getTime() : 0);
    switch (sort) {
      case 'recent':
        return [...filtered].sort((a, b) => time(b.createdAt) - time(a.createdAt));
      case 'earliest_departure':
        return [...filtered].sort((a, b) => time(a.departureDate) - time(b.departureDate));
      case 'price_low':
        return [...filtered].sort((a, b) => a.pricePerKg - b.pricePerKg);
      case 'price_high':
        return [...filtered].sort((a, b) => b.pricePerKg - a.pricePerKg);
      case 'weight_high':
        return [...filtered].sort((a, b) => b.remainingWeight - a.remainingWeight);
      case 'weight_low':
        return [...filtered].sort((a, b) => a.remainingWeight - b.remainingWeight);
      default:
        return filtered;
    }
  });

  protected readonly resultsLabel = computed(() => {
    const count = this.visibleListings().length;
    return this.i18n.t(count > 1 ? 'results_count' : 'results_count_one', { count });
  });

  constructor() {
    this.fetchListings();
  }

  protected onSortChange(sort: SortOption | null): void {
    this.filters.update((current) => ({ ...current, sort }));
  }

  private fetchListings(): void {
    this.loading.set(true);
    this.trips.active().subscribe({
      next: (listings) => {
        this.listings.set(listings.filter((listing) => listing.remainingWeight > 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
