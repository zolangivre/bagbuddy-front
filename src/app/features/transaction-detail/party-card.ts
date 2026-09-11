import { Component, computed, inject, input, signal } from '@angular/core';
import { ReviewsService } from '../../core/api/reviews.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyService } from '../../core/currency.service';
import { formatLocalizedDate, formatLocalizedTime } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { ListingInfo, Transaction } from '../../core/models';
import { TRANSACTION_STATUS } from '../../core/transaction-status';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/ui/avatar';
import { T } from '../../shared/ui/t';

/**
 * Portage de TransactionDetailComponents/SellerInformationCard.js +
 * ListingConditions.js : identite de l'autre partie, trajet, et conditions.
 */
@Component({
  selector: 'bb-party-card',
  imports: [T, Avatar, Icon],
  template: `
    <section class="bb-card">
      <div class="party">
        <bb-avatar [initials]="initials()" [size]="40" />
        <span class="identity">
          <span class="bb-card-title">{{ counterpartName() }}</span>
          <span class="bb-body-2">
            ★ {{ averageRating() === null ? 'N/A' : averageRating()!.toFixed(1) }} •
            <bb-t [key]="isSeller() ? 'buyer' : 'seller'" [reserve]="['buyer', 'seller']" />
          </span>
        </span>
      </div>

      <div class="route">
        <span class="airport">
          <strong class="bb-card-title">{{ listing().departureAirport }}</strong>
          <span class="bb-body-2"><bb-t key="departure" /></span>
        </span>
        <bb-icon name="arrow-right" [size]="24" />
        <span class="airport right">
          <strong class="bb-card-title">{{ listing().arrivalAirport }}</strong>
          <span class="bb-body-2"><bb-t key="arrival" /></span>
        </span>
      </div>

      <div class="times">
        <span class="time">
          <bb-icon name="plane-takeoff" [size]="16" />
          <span>
            <span class="bb-body-2">{{ dates().departureDate }}</span>
            <span class="hour">{{ dates().departureTime }}</span>
          </span>
        </span>
        <span class="time">
          <bb-icon name="plane-landing" [size]="16" />
          <span>
            <span class="bb-body-2">{{ dates().arrivalDate }}</span>
            <span class="hour">{{ dates().arrivalTime }}</span>
          </span>
        </span>
      </div>

      @if (showAvailability()) {
        <div class="availability">
          <span class="left">
            <bb-icon name="scale" [size]="16" />
            <span class="bb-card-title"
              >{{ listing().remainingWeight }}kg <bb-t key="available"
            /></span>
          </span>
          <span class="bb-number">{{ currency.format(listing().pricePerKg) }}/kg</span>
        </div>
      }
    </section>

    <section class="bb-card conditions">
      <h2 class="bb-card-title">
        <bb-icon name="notepad-text" [size]="24" />
        {{ i18n.t('conditions') }}
      </h2>
      <p class="bb-body-2">{{ listing().conditions || i18n.t('no_conditions') }}</p>
    </section>
  `,
  styles: `
    :host {
      display: contents;
    }

    .party {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: var(--bb-radius);
      background: var(--bb-subtle);
      margin-bottom: 20px;
    }

    .identity {
      display: flex;
      flex-direction: column;
    }

    .route {
      display: flex;
      align-items: center;
      gap: 16px;
      max-width: 560px;
      margin-bottom: 20px;
      color: var(--bb-primary);
    }

    .airport {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .airport.right {
      text-align: right;
    }

    /* Deux moities egales : la date et l'heure changent de format avec la
       langue (« 06:00 PM » vs « 18:00 »), la colonne ne doit pas bouger. */
    .times {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      gap: 12px;
      max-width: 560px;
      margin-bottom: 20px;
    }

    .times .time:last-child {
      justify-content: flex-end;
    }

    .time {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--bb-primary);
    }

    .time > span {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .hour {
      color: var(--bb-title);
    }

    .availability {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid var(--bb-border);
      padding-top: 16px;
    }

    .left {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--bb-success);
    }

    .conditions h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px;
      color: var(--bb-title);
    }

    .conditions h2 bb-icon {
      color: var(--bb-primary);
    }

    .conditions p {
      margin: 0;
      text-align: justify;
    }
  `,
})
export class PartyCard {
  protected readonly i18n = inject(I18nService);
  protected readonly currency = inject(CurrencyService);
  private readonly reviews = inject(ReviewsService);
  private readonly auth = inject(AuthService);

  /** Annonce affichee (transaction en cours, ou annonce seule avant reservation). */
  readonly listing = input.required<ListingInfo>();
  readonly transaction = input<Transaction | null>(null);

  protected readonly averageRating = signal<number | null>(null);

  protected readonly isSeller = computed(
    () => this.transaction()?.sellerId === this.auth.userInfo()?.sub,
  );

  protected readonly counterpartName = computed(() => {
    const transaction = this.transaction();
    if (this.isSeller()) return transaction?.buyerInfo?.name ?? '???';
    return this.listing().sellerUserInfo?.name ?? this.listing().userInfo?.name ?? '???';
  });

  protected readonly initials = computed(() => this.counterpartName().charAt(0).toUpperCase());

  protected readonly dates = computed(() => {
    const listing = this.listing();
    const lang = this.i18n.language();
    return {
      departureDate: formatLocalizedDate(listing.departureDate, lang),
      departureTime: formatLocalizedTime(listing.departureDate, lang),
      arrivalDate: formatLocalizedDate(listing.arrivalDate, lang),
      arrivalTime: formatLocalizedTime(listing.arrivalDate, lang),
    };
  });

  /** Le mobile masque le bloc poids/prix une fois la transaction confirmee. */
  protected readonly showAvailability = computed(() => {
    const transaction = this.transaction();
    if (!transaction) return true;
    const status = this.isSeller() ? transaction.sellerStatus : transaction.buyerStatus;
    return status !== TRANSACTION_STATUS.CONFIRMED && status !== TRANSACTION_STATUS.COMPLETED;
  });

  constructor() {
    queueMicrotask(() => this.fetchAverageRating());
  }

  private fetchAverageRating(): void {
    const transaction = this.transaction();
    const revieweeId = transaction
      ? this.isSeller()
        ? transaction.buyerId
        : transaction.sellerId
      : (this.listing().userInfo?.sub ?? this.listing().sellerUserInfo?.sub);
    if (!revieweeId) return;
    this.reviews.averageForReviewee(revieweeId).subscribe({
      next: (average) => this.averageRating.set(average),
      error: () => this.averageRating.set(null),
    });
  }
}
