import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyService } from '../../core/currency.service';
import { formatLocalizedDate, initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Transaction } from '../../core/models';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/ui/avatar';
import { Badge } from '../../shared/ui/badge';
import { FlightInfoCard } from '../../shared/ui/flight-info-card';
import { StatusBadge } from '../../shared/ui/status-badge';

/** Portage de components/TransactionCard.js. */
@Component({
  selector: 'bb-transaction-card',
  imports: [RouterLink, Avatar, Badge, StatusBadge, FlightInfoCard, Icon],
  template: `
    <a
      class="bb-card"
      routerLink="/transaction-detail"
      [queryParams]="{ transactionId: transaction().id }"
    >
      <div class="user">
        <bb-avatar [initials]="initials()" />
        <span class="user-text">
          <span class="bb-section-title">{{ counterpartName() }}</span>
          <span class="bb-body-2">{{ i18n.t('created_on') }} : {{ createdOn() }}</span>
        </span>
        <bb-icon name="arrow-right" [size]="16" />
      </div>

      <div class="status-row">
        <bb-badge
          [text]="i18n.t(isSelling() ? 'selling' : 'buying')"
          [background]="isSelling() ? 'var(--bb-green-a10)' : 'var(--bb-cyan-a10)'"
          [color]="isSelling() ? 'var(--bb-success)' : 'var(--bb-primary)'"
        />
        <bb-status-badge [status]="status()" />
      </div>

      <bb-flight-info-card [item]="transaction().listingInfo" />

      <div class="price-row">
        <span class="weight">
          <bb-icon name="weight" [size]="20" />
          <span class="bb-body">{{ transaction().weight }} kg</span>
        </span>
        <span class="rate">
          <span class="bb-body">{{ i18n.t('rate') }}/kg</span>
          <strong class="bb-stat-value">{{
            currency.format(transaction().listingInfo.pricePerKg)
          }}</strong>
        </span>
        <span class="total">
          <span class="bb-body">{{ i18n.t('total') }}</span>
          <strong class="bb-number">{{ currency.format(transaction().total) }}</strong>
        </span>
      </div>
    </a>
  `,
  styles: `
    .bb-card {
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100%;
    }

    .bb-card:hover {
      box-shadow: var(--bb-shadow-raised);
    }

    .user {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--bb-text);
    }

    .user-text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: auto;
    }

    .weight {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      color: var(--bb-primary);
    }

    .rate {
      text-align: center;
    }

    .total {
      text-align: right;
    }

    .rate span,
    .rate strong,
    .total span,
    .total strong {
      display: block;
    }

    .rate strong {
      color: var(--bb-title);
    }
  `,
})
export class TransactionCard {
  protected readonly i18n = inject(I18nService);
  protected readonly currency = inject(CurrencyService);
  private readonly auth = inject(AuthService);

  readonly transaction = input.required<Transaction>();

  protected readonly isSelling = computed(
    () => this.transaction().sellerId === this.auth.userInfo()?.sub,
  );

  protected readonly counterpartName = computed(() =>
    this.isSelling()
      ? (this.transaction().buyerInfo?.name ?? '')
      : (this.transaction().listingInfo.sellerUserInfo?.name ?? ''),
  );

  protected readonly initials = computed(() => initialsOf(this.counterpartName()));

  protected readonly status = computed(() => {
    const transaction = this.transaction();
    return this.isSelling() ? transaction.sellerStatus : transaction.buyerStatus;
  });

  protected readonly createdOn = computed(() =>
    formatLocalizedDate(this.transaction().createdAt, this.i18n.language()),
  );
}
