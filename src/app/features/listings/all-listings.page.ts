import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoadErrorKey, loadErrorKey } from '../../core/api/load-error';
import { TripsService } from '../../core/api/trips.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Listing } from '../../core/models';
import { IconButton } from '../../shared/ui/icon-button';
import { LoadError } from '../../shared/ui/load-error';
import { Loader } from '../../shared/ui/loader';
import { SubHeader } from '../../shared/ui/sub-header';
import { ListingCard } from './listing-card';

/** Portage de app/all-listing.js. */
@Component({
  selector: 'bb-all-listings-page',
  imports: [SubHeader, IconButton, ListingCard, Loader, LoadError],
  template: `
    <bb-sub-header [title]="i18n.t('all_listings')" (back)="goBack()">
      <bb-icon-button
        icon="circle-plus"
        [iconSize]="24"
        [label]="i18n.t('create_new_listing')"
        (pressed)="createListing()"
      />
    </bb-sub-header>

    <div class="bb-page content">
      @if (loading()) {
        <bb-loader [label]="i18n.t('loading')" />
      } @else if (loadError(); as error) {
        <bb-load-error [messageKey]="error" (retry)="load()" />
      } @else if (listings().length) {
        <div class="grid">
          @for (listing of listings(); track listing.id) {
            <bb-listing-card [item]="listing" [airportNames]="airportNames(listing)" />
          }
        </div>
      } @else {
        <p class="bb-empty">{{ i18n.t('no_active_listings') }}</p>
      }
    </div>
  `,
  styles: `
    .content {
      padding-top: 16px;
      padding-bottom: 40px;
    }

    .grid {
      display: grid;
      gap: 16px;
      grid-template-columns: 1fr;
    }

    @media (min-width: 1100px) {
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
})
export class AllListingsPage {
  protected readonly i18n = inject(I18nService);
  private readonly trips = inject(TripsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly listings = signal<Listing[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<LoadErrorKey | null>(null);
  private readonly names = signal<Map<string, string>>(new Map());

  constructor() {
    this.load();
  }

  protected load(): void {
    const sub = this.auth.userInfo()?.sub;
    if (!sub) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.loadError.set(null);
    this.trips.byUser(sub).subscribe({
      next: (listings) => {
        this.listings.set(Array.isArray(listings) ? listings : []);
        this.loading.set(false);
        void this.loadAirportNames();
      },
      error: (error) => {
        this.loadError.set(loadErrorKey(error));
        this.loading.set(false);
      },
    });
  }

  protected airportNames(listing: Listing): { departure: string; arrival: string } {
    const names = this.names();
    return {
      departure: names.get(listing.departureAirport) ?? '???',
      arrival: names.get(listing.arrivalAirport) ?? '???',
    };
  }

  /** La table des aeroports est volumineuse : chargee apres l'affichage. */
  private async loadAirportNames(): Promise<void> {
    const { AIRPORTS } = await import('../../core/airports');
    this.names.set(new Map(AIRPORTS.map((airport) => [airport.value, airport.name])));
  }

  protected createListing(): void {
    void this.router.navigate(['/listings/new']);
  }

  protected goBack(): void {
    history.length > 1 ? history.back() : void this.router.navigate(['/profile']);
  }
}
