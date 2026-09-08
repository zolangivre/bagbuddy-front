import { Component, computed, inject, signal } from '@angular/core';
import { TransactionsService } from '../../core/api/transactions.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyService } from '../../core/currency.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ListingFilters, Transaction } from '../../core/models';
import { TRANSACTION_STATUS } from '../../core/transaction-status';
import { Badge } from '../../shared/ui/badge';
import { FilterBar } from '../../shared/ui/filter-bar';
import { Loader } from '../../shared/ui/loader';
import { PageHeader } from '../../shared/ui/page-header';
import { Segmented, SegmentedOption } from '../../shared/ui/segmented';
import { StatCard } from '../../shared/ui/stat-card';
import { TransactionCard } from './transaction-card';

/** Portage de app/(tabs)/transactions.js. */
@Component({
  selector: 'bb-transactions-page',
  imports: [PageHeader, StatCard, Badge, FilterBar, Segmented, TransactionCard, Loader],
  template: `
    <bb-page-header
      [title]="i18n.t('transactions_title')"
      [subtitle]="i18n.t('transactions_subtitle')"
    >
      <bb-badge
        slot="aside"
        [text]="transactions().length + ' ' + i18n.t('total')"
        background="rgba(0, 0, 0, 0.18)"
        color="var(--bb-white)"
      />

      <div class="stats">
        <bb-stat-card
          icon="trending-up"
          [value]="currency.format(totalEarned())"
          [label]="i18n.t('total_earned')"
        />
        <bb-stat-card
          icon="activity"
          [value]="currency.format(totalSpent())"
          [label]="i18n.t('total_spent')"
        />
      </div>

      <bb-filter-bar [(filters)]="filters" [showStatusFilter]="true" />
    </bb-page-header>

    <div class="bb-page segmented">
      <bb-segmented [options]="modes()" [(value)]="mode" [label]="i18n.t('transactions')" />
    </div>

    <div class="bb-page content">
      @if (loading()) {
        <bb-loader [label]="i18n.t('loading')" />
      } @else if (visible().length) {
        <div class="grid">
          @for (transaction of visible(); track transaction.id) {
            <bb-transaction-card [transaction]="transaction" />
          }
        </div>
      } @else {
        <p class="bb-empty">
          {{
            mode() === 'active'
              ? i18n.t('no_active_transactions')
              : i18n.t('no_completed_transactions')
          }}
        </p>
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
export class TransactionsPage {
  protected readonly i18n = inject(I18nService);
  protected readonly currency = inject(CurrencyService);
  private readonly api = inject(TransactionsService);
  private readonly auth = inject(AuthService);

  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly loading = signal(false);
  protected readonly mode = signal('active');
  protected readonly filters = signal<ListingFilters>({});

  protected readonly modes = computed<SegmentedOption[]>(() => [
    {
      key: 'active',
      label: this.i18n.t('active'),
      icon: 'activity',
      color: 'var(--bb-primary-strong)',
    },
    {
      key: 'completed',
      label: this.i18n.t('completed'),
      icon: 'calendar',
      color: 'var(--bb-success)',
    },
  ]);

  private readonly sub = computed(() => this.auth.userInfo()?.sub ?? '');

  protected readonly totalEarned = computed(() =>
    this.transactions()
      .filter((t) => t.sellerId === this.sub() && t.sellerStatus === TRANSACTION_STATUS.COMPLETED)
      .reduce((sum, t) => sum + t.total, 0),
  );

  protected readonly totalSpent = computed(() =>
    this.transactions()
      .filter((t) => t.buyerId === this.sub() && t.buyerStatus === TRANSACTION_STATUS.COMPLETED)
      .reduce((sum, t) => sum + t.total, 0),
  );

  /** Actives = ni terminees des deux cotes, ni annulees (meme regle que le mobile). */
  protected readonly visible = computed(() => {
    const isClosed = (t: Transaction) => {
      const completed =
        t.sellerStatus === TRANSACTION_STATUS.COMPLETED &&
        t.buyerStatus === TRANSACTION_STATUS.COMPLETED;
      const cancelled =
        t.sellerStatus === TRANSACTION_STATUS.CANCELLED ||
        t.buyerStatus === TRANSACTION_STATUS.CANCELLED;
      return completed || cancelled;
    };

    const list = this.transactions().filter((t) =>
      this.mode() === 'active' ? !isClosed(t) : isClosed(t),
    );

    const { from, to, minPrice, maxPrice, minWeight, maxWeight, status } = this.filters();
    return list.filter((item) => {
      const listing = item.listingInfo;
      const role = item.sellerId === this.sub() ? 'seller' : 'buyer';
      const itemStatus = role === 'seller' ? item.sellerStatus : item.buyerStatus;
      return (
        (!from || listing.departureAirport === from) &&
        (!to || listing.arrivalAirport === to) &&
        (minPrice === undefined || listing.pricePerKg >= minPrice) &&
        (maxPrice === undefined || listing.pricePerKg <= maxPrice) &&
        (minWeight === undefined || item.weight >= minWeight) &&
        (maxWeight === undefined || item.weight <= maxWeight) &&
        (this.mode() !== 'active' || !status || itemStatus === status)
      );
    });
  });

  constructor() {
    const sub = this.sub();
    if (!sub) return;
    this.loading.set(true);
    this.api.byUser(sub).subscribe({
      next: (transactions) => {
        this.transactions.set(transactions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
