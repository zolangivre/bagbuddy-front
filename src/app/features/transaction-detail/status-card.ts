import { Component, computed, inject, input } from '@angular/core';
import { CurrencyService } from '../../core/currency.service';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Role, Transaction } from '../../core/models';
import { TRANSACTION_STATUS } from '../../core/transaction-status';
import { Icon } from '../../shared/icon/icon';
import { IconName } from '../../shared/icon/icons';

type BottomKind = 'none' | 'requested' | 'rejected' | 'payment' | 'settled';

interface StatusView {
  icon: IconName;
  color: string;
  background: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  bottom: BottomKind;
}

/**
 * Portage de components/StatusCard.js : le grand encart qui explique l'etape
 * courante, avec le recapitulatif chiffre en bas.
 */
@Component({
  selector: 'bb-status-card',
  imports: [Icon],
  template: `
    @if (view(); as v) {
      <section class="card" [style.background]="v.background">
        <bb-icon [name]="v.icon" [size]="60" [style.color]="v.color" />
        <h2 class="bb-card-status-title" [style.color]="v.color">{{ i18n.t(v.titleKey) }}</h2>
        <p class="bb-body centered">{{ i18n.t(v.descriptionKey, descriptionParams()) }}</p>

        @switch (v.bottom) {
          @case ('requested') {
            <div class="bottom inline">
              <span class="bb-body">{{ i18n.t('requested_weight') }} :</span>
              <strong class="bb-number">{{ transaction()?.weight }}kg</strong>
            </div>
          }
          @case ('rejected') {
            <div class="bottom inline">
              <span class="bb-body">{{ i18n.t('reject_request') }} :</span>
              <strong class="bb-number error">{{ transaction()?.weight }}kg</strong>
            </div>
          }
          @case ('payment') {
            <div class="bottom">
              <div class="line">
                <span class="bb-body">{{
                  status() === statuses.RESERVATION_RECEIVED
                    ? i18n.t('requested_weight')
                    : i18n.t('approved_weight')
                }}</span>
                <span class="bb-body">{{ transaction()?.weight }}kg</span>
              </div>
              <div class="line">
                <span class="bb-body">{{ i18n.t('price_per_kg') }} :</span>
                <span class="bb-body">{{
                  currency.format(transaction()?.listingInfo?.pricePerKg)
                }}</span>
              </div>
              <span class="bb-divider"></span>
              <div class="line">
                <span class="bb-title-sm">{{
                  status() === statuses.AWAITING_PAYMENT
                    ? i18n.t('expected_payment')
                    : i18n.t('total_amount')
                }}</span>
                <strong class="bb-number">{{ currency.format(transaction()?.total) }}</strong>
              </div>
            </div>
          }
          @case ('settled') {
            <div class="bottom centered-block">
              <span class="bb-body">{{ i18n.t(settledLabelKey()) }}</span>
              <strong class="bb-number success">{{ currency.format(transaction()?.total) }}</strong>
              <span class="bb-body">
                {{ transaction()?.weight }}kg -
                {{ currency.format(transaction()?.listingInfo?.pricePerKg) }}/kg
              </span>
            </div>
          }
        }
      </section>
    }
  `,
  styles: `
    .card {
      padding: 20px;
      border-radius: var(--bb-radius);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 17px;
      text-align: center;
    }

    h2,
    p {
      margin: 0;
    }

    .centered {
      text-align: center;
    }

    .bottom {
      width: 100%;
      padding: 10px;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-title-inverse);
      display: flex;
      flex-direction: column;
      gap: 5px;
      color: var(--bb-title);
    }

    .bottom.inline {
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .bottom.centered-block {
      align-items: center;
    }

    .line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .error {
      color: var(--bb-error);
    }

    .success {
      color: var(--bb-success);
    }
  `,
})
export class StatusCard {
  protected readonly i18n = inject(I18nService);
  protected readonly currency = inject(CurrencyService);
  protected readonly statuses = TRANSACTION_STATUS;

  readonly status = input.required<string>();
  readonly role = input<Role>('buyer');
  readonly transaction = input<Transaction | null>(null);

  protected readonly view = computed<StatusView | null>(() => {
    const role = this.role();
    switch (this.status()) {
      case TRANSACTION_STATUS.BROWSE_LISTING:
        return {
          icon: 'luggage',
          color: 'var(--bb-primary)',
          background: 'var(--bb-cyan-a05)',
          titleKey: 'browse_listings_title',
          descriptionKey: 'browse_listings_description',
          bottom: 'none',
        };
      case TRANSACTION_STATUS.WAITING_FOR_RESPONSE_BUYER:
        return {
          icon: 'clock',
          color: 'var(--bb-primary)',
          background: 'var(--bb-cyan-a05)',
          titleKey: 'waiting_for_response_title',
          descriptionKey: 'waiting_for_response_description',
          bottom: 'requested',
        };
      case TRANSACTION_STATUS.WAITING_FOR_RESPONSE_SELLER:
        return {
          icon: 'circle-x',
          color: 'var(--bb-error)',
          background: 'var(--bb-red-a05)',
          titleKey: 'waiting_for_response_title',
          descriptionKey: 'waiting_for_response_description',
          bottom: 'rejected',
        };
      case TRANSACTION_STATUS.REQUEST_REJECTED:
        return {
          icon: 'clock',
          color: 'var(--bb-error)',
          background: 'var(--bb-red-a05)',
          titleKey: 'request_rejected_title',
          descriptionKey: 'request_rejected_description',
          bottom: 'rejected',
        };
      case TRANSACTION_STATUS.PAYMENT_REQUIRED:
        return {
          icon: 'circle-check',
          color: 'var(--bb-success)',
          background: 'var(--bb-green-a05)',
          titleKey: 'payment_required_title',
          descriptionKey: 'payment_required_description',
          bottom: 'payment',
        };
      case TRANSACTION_STATUS.RESERVATION_RECEIVED:
        return {
          icon: 'circle-alert',
          color: 'var(--bb-warning)',
          background: 'var(--bb-yellow-a05)',
          titleKey: 'reservation_received_title',
          descriptionKey: 'reservation_received_description',
          bottom: 'payment',
        };
      case TRANSACTION_STATUS.AWAITING_PAYMENT:
        return {
          icon: 'clock',
          color: 'var(--bb-primary)',
          background: 'var(--bb-cyan-a05)',
          titleKey: 'awaiting_payment_title',
          descriptionKey: 'awaiting_payment_description',
          bottom: 'payment',
        };
      case TRANSACTION_STATUS.CONFIRMED:
        return {
          icon: 'circle-check',
          color: 'var(--bb-success)',
          background: 'var(--bb-green-a05)',
          titleKey: role === 'buyer' ? 'confirmed_title_buyer' : 'confirmed_title_seller',
          descriptionKey:
            role === 'buyer' ? 'confirmed_description_buyer' : 'confirmed_description_seller',
          bottom: 'settled',
        };
      case TRANSACTION_STATUS.COMPLETED:
        return {
          icon: 'circle-check',
          color: 'var(--bb-success)',
          background: 'var(--bb-green-a05)',
          titleKey: 'completed_title',
          descriptionKey: 'completed_description',
          bottom: 'settled',
        };
      case TRANSACTION_STATUS.CANCELLED:
        return {
          icon: 'circle-x',
          color: 'var(--bb-error)',
          background: 'var(--bb-red-a05)',
          titleKey: 'cancelled_title',
          descriptionKey: 'cancelled_description',
          bottom: 'none',
        };
      default:
        return null;
    }
  });

  /** Les libelles attendent seller / buyer / weight selon le statut. */
  protected readonly descriptionParams = computed(() => {
    const transaction = this.transaction();
    return {
      seller: transaction?.listingInfo?.sellerUserInfo?.name ?? '',
      buyer: transaction?.buyerInfo?.name ?? '',
      weight: transaction ? `${transaction.weight}kg` : '',
    };
  });

  protected readonly settledLabelKey = computed<TranslationKey>(() => {
    if (this.status() === TRANSACTION_STATUS.COMPLETED) return 'transaction_total';
    return this.role() === 'buyer' ? 'total_paid' : 'amount_received';
  });
}
