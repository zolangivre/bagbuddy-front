import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ReviewsService } from '../../core/api/reviews.service';
import { TransactionsService } from '../../core/api/transactions.service';
import { TripsService } from '../../core/api/trips.service';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { CurrencyService } from '../../core/currency.service';
import { formatLocalizedDate, initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Listing, Review } from '../../core/models';
import { ThemeService } from '../../core/theme.service';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/ui/avatar';
import { Badge } from '../../shared/ui/badge';
import { IconButton } from '../../shared/ui/icon-button';
import { Loader } from '../../shared/ui/loader';
import { PageHeader } from '../../shared/ui/page-header';
import { ReviewCard } from '../../shared/ui/review-card';
import { Segmented, SegmentedOption } from '../../shared/ui/segmented';
import { StatCard } from '../../shared/ui/stat-card';

/** Portage de app/(tabs)/profile.js. */
@Component({
  selector: 'bb-profile-page',
  imports: [
    RouterLink,
    PageHeader,
    IconButton,
    Avatar,
    Badge,
    StatCard,
    Segmented,
    ReviewCard,
    Loader,
    Icon,
  ],
  template: `
    <bb-page-header [title]="i18n.t('profile')" [subtitle]="i18n.t('manage_your_account')">
      <bb-icon-button
        slot="aside"
        icon="square-pen"
        data-variant="on-gradient"
        [label]="i18n.t('edit_profile')"
        [iconSize]="24"
        (pressed)="openAccountConsole()"
      />
    </bb-page-header>

    <div class="bb-page content bb-with-rail">
      <!--
        Sur mobile la carte d'identite passait au-dessus du contenu et defilait
        avec lui. Sur grand ecran elle reste en colonne, visible pendant qu'on
        parcourt les annonces, les avis ou les reglages.
      -->
      <aside class="identity bb-rail-sticky">
        <bb-avatar [initials]="initials()" [size]="72" />
        <h2 class="bb-title-md">{{ user()?.name }}</h2>
        <p class="bb-body-2 email">{{ user()?.email }}</p>

        <bb-badge
          [text]="user()?.email_verified ? i18n.t('verified') : i18n.t('not_verified')"
          [background]="user()?.email_verified ? 'var(--bb-green-a10)' : 'var(--bb-red-a10)'"
          [color]="user()?.email_verified ? 'var(--bb-success)' : 'var(--bb-error)'"
        >
          <bb-icon name="shield" [size]="16" />
        </bb-badge>

        @if (user()?.bio) {
          <p class="bb-body-2 bio">{{ user()?.bio }}</p>
        }

        <div class="stats">
          <bb-stat-card
            icon="trending-up"
            [value]="currency.format(totalEarned())"
            [label]="i18n.t('total_earned')"
            background="var(--bb-green-a10)"
            borderColor="var(--bb-green-a20)"
            iconColor="var(--bb-success)"
            valueColor="var(--bb-success)"
            labelColor="var(--bb-text)"
          />
          <bb-stat-card
            icon="activity"
            [value]="currency.format(totalSpent())"
            [label]="i18n.t('total_spent')"
            background="var(--bb-cyan-a10)"
            borderColor="var(--bb-cyan-a20)"
            iconColor="var(--bb-primary)"
            valueColor="var(--bb-primary)"
            labelColor="var(--bb-text)"
          />
        </div>

        <p class="bb-body-3 count">{{ transactionCount() ?? 0 }} {{ i18n.t('transactions_1') }}</p>
      </aside>

      <section class="panel">
        <bb-segmented [options]="tabs()" [(value)]="tab" [label]="i18n.t('profile')" />

        @switch (tab()) {
          @case ('listings') {
            <section class="bb-card">
              <div class="section-head">
                <h2 class="bb-card-title">{{ i18n.t('active_listings') }}</h2>
                <a class="bb-highlight" routerLink="/listings">{{ i18n.t('view_all') }}</a>
              </div>

              @if (loadingListings()) {
                <bb-loader [size]="36" [label]="i18n.t('loading')" />
              } @else if (listings().length) {
                <ul class="rows">
                  @for (listing of listings().slice(0, 5); track listing.id) {
                    <li>
                      <span class="row-route">
                        <span class="bb-code code">{{ listing.departureAirport }}</span>
                        <bb-icon name="arrow-right" [size]="16" />
                        <span class="bb-code code">{{ listing.arrivalAirport }}</span>
                      </span>
                      <span class="row-meta">
                        <span class="bb-body-2">
                          {{ listing.remainingWeight }} kg ·
                          {{ currency.format(listing.pricePerKg) }}/kg
                        </span>
                        <span class="bb-body-3">
                          {{ date(listing.departureDate) }} → {{ date(listing.arrivalDate) }}
                        </span>
                      </span>
                      <a
                        class="edit"
                        [routerLink]="['/listings', listing.id, 'edit']"
                        [attr.aria-label]="i18n.t('edit_listing')"
                      >
                        <bb-icon name="pencil" [size]="20" />
                      </a>
                    </li>
                  }
                </ul>
              } @else {
                <p class="bb-empty">{{ i18n.t('no_active_listings') }}</p>
              }
            </section>
          }

          @case ('reviews') {
            <section class="bb-card">
              <div class="section-head">
                <h2 class="bb-card-title">{{ i18n.t('reviews') }}</h2>
                <a class="bb-highlight" routerLink="/reviews">{{ i18n.t('view_all') }}</a>
              </div>

              @if (loadingReviews()) {
                <bb-loader [size]="36" [label]="i18n.t('loading')" />
              } @else if (reviews().length) {
                <ul class="rows rows--plain">
                  @for (review of reviews().slice(0, 5); track review.id) {
                    <li><bb-review-card [review]="review" /></li>
                  }
                </ul>
              } @else {
                <p class="bb-empty">{{ i18n.t('no_reviews_yet') }}</p>
              }
            </section>
          }

          @case ('settings') {
            <section class="bb-card settings">
              <h2 class="bb-card-title">{{ i18n.t('settings') }}</h2>

              <div class="setting">
                <bb-icon [name]="theme.scheme() === 'dark' ? 'moon' : 'sun'" [size]="24" />
                <span class="setting-text">
                  <span class="bb-section-title">{{ i18n.t('dark_mode') }}</span>
                  <span class="bb-body-2">{{ i18n.t('toggle_dark_mode') }}</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  class="switch"
                  [attr.aria-checked]="theme.scheme() === 'dark'"
                  [attr.aria-label]="i18n.t('dark_mode')"
                  (click)="theme.toggle()"
                >
                  <span class="knob"></span>
                </button>
              </div>

              <div class="setting">
                <bb-icon name="languages" [size]="24" />
                <span class="bb-section-title grow">{{ i18n.t('change_language') }}</span>
                <div class="options">
                  <button
                    type="button"
                    [class.active]="i18n.language() === 'en'"
                    [attr.aria-pressed]="i18n.language() === 'en'"
                    (click)="i18n.changeLanguage('en')"
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    [class.active]="i18n.language() === 'fr'"
                    [attr.aria-pressed]="i18n.language() === 'fr'"
                    (click)="i18n.changeLanguage('fr')"
                  >
                    FR
                  </button>
                </div>
              </div>

              <div class="setting">
                <bb-icon name="banknote" [size]="24" />
                <span class="bb-section-title grow">{{ i18n.t('change_currency') }}</span>
                <div class="options">
                  <button
                    type="button"
                    [class.active]="currency.currency() === 'USD'"
                    [attr.aria-pressed]="currency.currency() === 'USD'"
                    (click)="currency.changeCurrency('USD')"
                  >
                    $
                  </button>
                  <button
                    type="button"
                    [class.active]="currency.currency() === 'EUR'"
                    [attr.aria-pressed]="currency.currency() === 'EUR'"
                    (click)="currency.changeCurrency('EUR')"
                  >
                    €
                  </button>
                </div>
              </div>

              <button type="button" class="logout" (click)="logout()">
                <bb-icon name="log-out" [size]="24" />
                {{ i18n.t('log_out') }}
              </button>
            </section>
          }
        }
      </section>
    </div>
  `,
  styles: `
    .content {
      padding-top: 24px;
      padding-bottom: 48px;
    }

    .identity {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 24px;
      background: var(--bb-card);
      border-radius: var(--bb-radius);
      box-shadow: var(--bb-shadow-card);
    }

    .identity h2 {
      margin: 0;
    }

    .email,
    .bio,
    .count {
      margin: 0;
    }

    .email {
      word-break: break-word;
    }

    .bio {
      max-width: 40ch;
    }

    .stats {
      display: flex;
      gap: 12px;
      width: 100%;
      margin-top: 4px;
    }

    .panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Le selecteur d'onglets n'a pas besoin de toute la largeur du panneau. */
    .panel > bb-segmented {
      display: block;
      max-width: 520px;
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .section-head h2 {
      margin: 0;
    }

    .rows {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .rows li {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-subtle);
    }

    .rows--plain li {
      background: transparent;
      padding: 0 0 12px;
      border-bottom: 1px solid var(--bb-border);
    }

    .rows--plain li:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .row-route {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--bb-primary);
    }

    .code {
      font-size: 1.25rem;
    }

    .row-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .edit {
      width: 40px;
      height: 40px;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-cyan-a10);
      color: var(--bb-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
    }

    .settings {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .settings h2 {
      margin: 0;
    }

    .setting {
      display: flex;
      align-items: center;
      gap: 16px;
      color: var(--bb-primary);
    }

    .setting-text {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .grow {
      flex: 1;
    }

    .switch {
      width: 52px;
      height: 30px;
      border-radius: 999px;
      border: none;
      background: var(--bb-border);
      padding: 3px;
      display: inline-flex;
      justify-content: flex-start;
      transition: background 0.15s ease;
    }

    .switch[aria-checked='true'] {
      background: var(--bb-primary-strong);
      justify-content: flex-end;
    }

    .knob {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: var(--bb-white);
    }

    .options {
      display: flex;
      gap: 10px;
    }

    .options button {
      padding: 8px 14px;
      border-radius: var(--bb-radius-sm);
      border: 1px solid var(--bb-border);
      background: transparent;
      color: var(--bb-text);
      font-size: var(--bb-fs-body-2);
    }

    .options button.active {
      background: var(--bb-primary-strong);
      border-color: var(--bb-primary-strong);
      color: var(--bb-white);
    }

    .logout {
      display: flex;
      align-items: center;
      gap: 16px;
      border: none;
      background: transparent;
      color: var(--bb-error);
      font-size: var(--bb-fs-h4);
      font-weight: 600;
      padding: 0;
    }
  `,
})
export class ProfilePage {
  protected readonly i18n = inject(I18nService);
  protected readonly currency = inject(CurrencyService);
  protected readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly trips = inject(TripsService);
  private readonly transactions = inject(TransactionsService);
  private readonly reviewsApi = inject(ReviewsService);
  private readonly confirm = inject(ConfirmService);

  protected readonly tab = signal('listings');
  protected readonly listings = signal<Listing[]>([]);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly transactionCount = signal<number | null>(null);
  protected readonly totalEarned = signal(0);
  protected readonly totalSpent = signal(0);
  protected readonly loadingListings = signal(false);
  protected readonly loadingReviews = signal(false);

  protected readonly user = this.auth.userInfo;
  protected readonly initials = computed(() => initialsOf(this.user()?.name, '?'));

  protected readonly tabs = computed<SegmentedOption[]>(() => [
    { key: 'listings', label: this.i18n.t('listings'), color: 'var(--bb-primary-strong)' },
    { key: 'reviews', label: this.i18n.t('reviews'), color: 'var(--bb-success-strong)' },
    { key: 'settings', label: this.i18n.t('settings'), color: 'var(--bb-warning-strong)' },
  ]);

  constructor() {
    const sub = this.user()?.sub;
    if (!sub) return;

    this.loadingListings.set(true);
    this.trips.byUser(sub).subscribe({
      next: (listings) => {
        this.listings.set(Array.isArray(listings) ? listings : []);
        this.loadingListings.set(false);
      },
      error: () => this.loadingListings.set(false),
    });

    this.loadingReviews.set(true);
    this.reviewsApi.forReviewee(sub).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.loadingReviews.set(false);
      },
      error: () => this.loadingReviews.set(false),
    });

    this.transactions.countForUser(sub).subscribe({ next: (c) => this.transactionCount.set(c) });
    this.transactions.totalEarned(sub).subscribe({ next: (t) => this.totalEarned.set(t ?? 0) });
    this.transactions.totalSpent(sub).subscribe({ next: (t) => this.totalSpent.set(t ?? 0) });
  }

  protected date(value?: string): string {
    return formatLocalizedDate(value, this.i18n.language());
  }

  /**
   * Le mobile ouvre la console compte Keycloak plutot qu'un formulaire maison :
   * on garde ce comportement, et on recharge le profil au retour.
   */
  protected openAccountConsole(): void {
    window.open(environment.keycloakAccountConsole, '_blank', 'noopener');
    window.addEventListener('focus', () => void this.auth.loadUserInfo(), { once: true });
  }

  protected async logout(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('log_out'),
      message: this.i18n.t('are_you_sure_you_want_to_log_out'),
      confirmText: this.i18n.t('log_out'),
      cancelText: this.i18n.t('cancel'),
      tone: 'error',
    });
    if (confirmed) await this.auth.signOut();
  }
}
