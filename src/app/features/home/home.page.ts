import { Component, computed, inject, signal } from '@angular/core';
import { TripsService } from '../../core/api/trips.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyService } from '../../core/currency.service';
import { initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Listing, ListingFilters } from '../../core/models';
import { Avatar } from '../../shared/ui/avatar';
import { FilterBar } from '../../shared/ui/filter-bar';
import { Loader } from '../../shared/ui/loader';
import { PageHeader } from '../../shared/ui/page-header';
import { Segmented, SegmentedOption } from '../../shared/ui/segmented';
import { StatCard } from '../../shared/ui/stat-card';
import { HomeCard } from './home-card';
import { SellView } from './sell-view';

/** Portage de app/(tabs)/home.js. */
@Component({
  selector: 'bb-home-page',
  imports: [PageHeader, StatCard, Avatar, FilterBar, Segmented, HomeCard, SellView, Loader],
  template: `
    <bb-page-header
      [title]="i18n.t('welcome_back', { name: firstName() })"
      [subtitle]="i18n.t('find_luggage_space')"
    >
      <bb-avatar slot="aside" [initials]="initials()" [size]="48" />

      <div class="stats">
        <bb-stat-card
          icon="plane"
          [value]="listings().length.toString()"
          [label]="i18n.t('active_routes')"
        />
        <bb-stat-card
          icon="weight"
          [value]="totalWeight() + 'kg'"
          [label]="i18n.t('available_weight')"
        />
        <bb-stat-card
          icon="trending-up"
          [value]="currency.format(averagePrice())"
          [label]="i18n.t('avg_price')"
        />
      </div>

      <bb-filter-bar [(filters)]="filters" />
    </bb-page-header>

    <div class="bb-page segmented">
      <bb-segmented [options]="modes()" [(value)]="mode" [label]="i18n.t('home')" />
    </div>

    <div class="bb-page content">
      @if (mode() === 'buy') {
        @if (loading()) {
          <bb-loader [label]="i18n.t('loading')" />
        } @else if (visibleListings().length) {
          <div class="grid">
            @for (listing of visibleListings(); track listing.id) {
              <bb-home-card [item]="listing" />
            }
          </div>
        } @else {
          <p class="bb-empty">{{ i18n.t('no_results_found') }}</p>
        }
      } @else {
        <bb-sell-view />
      }
    </div>
  `,
  styles: `
    .stats {
      display: flex;
      gap: 16px;
    }

    .segmented {
      margin-top: -20px;
      position: relative;
      z-index: 1;
    }

    .content {
      padding-top: 24px;
      padding-bottom: 40px;
    }

    .grid {
      display: grid;
      gap: 15px;
      grid-template-columns: 1fr;
    }

    @media (min-width: 900px) {
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
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

  protected readonly modes = computed<SegmentedOption[]>(() => [
    {
      key: 'buy',
      label: this.i18n.t('buy_weight'),
      icon: 'weight',
      color: 'var(--bb-primary-strong)',
    },
    { key: 'sell', label: this.i18n.t('sell_weight'), icon: 'plus', color: 'var(--bb-success)' },
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

  /** Meme logique de filtre/tri que applyFilters() du mobile. */
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

  constructor() {
    this.fetchListings();
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
