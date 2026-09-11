import { Component, computed, inject, signal } from '@angular/core';
import { LoadErrorKey, loadErrorKey } from '../../core/api/load-error';
import { TransactionsService } from '../../core/api/transactions.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyService } from '../../core/currency.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ListingFilters, Transaction } from '../../core/models';
import { TRANSACTION_STATUS } from '../../core/transaction-status';
import { Filters } from '../../shared/ui/filters';
import { LoadError } from '../../shared/ui/load-error';
import { Loader } from '../../shared/ui/loader';
import { PageHeader } from '../../shared/ui/page-header';
import { RevealMore, revealInSlices } from '../../shared/ui/reveal-more';
import { ResultsHeader } from '../../shared/ui/results-header';
import { Segmented, SegmentedOption } from '../../shared/ui/segmented';
import { StatCard } from '../../shared/ui/stat-card';
import { TransactionCard } from './transaction-card';

/** Lignes rendues par tranche ; voir bb-reveal-more pour le pourquoi. */
const TRANSACTIONS_PAGE_SIZE = 30;

/** Portage de app/(tabs)/transactions.js. */
@Component({
  selector: 'bb-transactions-page',
  imports: [
    PageHeader,
    StatCard,
    Filters,
    ResultsHeader,
    Segmented,
    TransactionCard,
    Loader,
    LoadError,
    RevealMore,
  ],
  template: `
    <bb-page-header
      [title]="i18n.t('transactions_title')"
      [subtitle]="i18n.t('transactions_subtitle')"
    >
      <div class="bb-stat-row">
        <bb-stat-card
          icon="trending-up"
          [value]="loaded() ? currency.format(totalEarned()) : '–'"
          labelKey="total_earned"
        />
        <bb-stat-card
          icon="activity"
          [value]="loaded() ? currency.format(totalSpent()) : '–'"
          labelKey="total_spent"
        />
        <bb-stat-card
          icon="credit-card"
          [value]="loaded() ? transactions().length.toString() : '–'"
          labelKey="transactions"
        />
      </div>
    </bb-page-header>

    <div class="bb-page switcher">
      <bb-segmented [options]="modes()" [(value)]="mode" [label]="i18n.t('transactions')" />
    </div>

    <div class="bb-page content">
      <div class="bb-with-rail">
        <bb-filters [(filters)]="filters" [showStatusFilter]="mode() === 'active'" />

        <section>
          <bb-results-header [label]="resultsLabel()" />

          @if (loading()) {
            <bb-loader [label]="i18n.t('loading')" />
          } @else if (loadError(); as error) {
            <bb-load-error [messageKey]="error" (retry)="load()" />
          } @else if (visible().length) {
            <div class="list-head" aria-hidden="true">
              <span class="bb-body-3">{{ i18n.t('buyer') }} / {{ i18n.t('seller') }}</span>
              <span class="bb-body-3">{{ i18n.t('departure') }}</span>
              <span class="bb-body-3">{{ i18n.t('weight') }}</span>
              <span class="bb-body-3 right">{{ i18n.t('total') }}</span>
              <span class="bb-body-3 right">{{ i18n.t('status') }}</span>
            </div>

            <div class="list">
              @for (transaction of slices.shown(); track transaction.id) {
                <bb-transaction-card [transaction]="transaction" />
              }
            </div>
            @if (slices.hasMore()) {
              <bb-reveal-more [count]="slices.count()" (reached)="slices.more()" />
            }
          } @else {
            <p class="bb-empty">
              {{
                mode() === 'active'
                  ? i18n.t('no_active_transactions')
                  : i18n.t('no_completed_transactions')
              }}
            </p>
          }
        </section>
      </div>
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

    .list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .list-head {
      display: none;
    }

    @media (min-width: 900px) {
      .list-head {
        display: grid;
        grid-template-columns: var(--bb-tx-columns);
        gap: 20px;
        padding: 0 20px 8px;
      }

      .list-head .right {
        text-align: right;
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
  protected readonly loadError = signal<LoadErrorKey | null>(null);
  protected readonly mode = signal('active');
  protected readonly filters = signal<ListingFilters>({});

  protected readonly modes = computed<SegmentedOption[]>(() => [
    {
      key: 'active',
      labelKey: 'active',
      icon: 'activity',
      color: 'var(--bb-primary-strong)',
    },
    {
      key: 'completed',
      labelKey: 'completed',
      icon: 'calendar',
      color: 'var(--bb-success-strong)',
    },
  ]);

  /** Faux pendant le chargement et apres un echec : pas de « 0 » qui passerait pour un resultat. */
  protected readonly loaded = computed(() => !this.loading() && !this.loadError());

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

  protected readonly slices = revealInSlices(this.visible, TRANSACTIONS_PAGE_SIZE);

  protected readonly resultsLabel = computed(() => {
    if (!this.loaded()) return '\u00a0';
    const count = this.visible().length;
    return this.i18n.t(count > 1 ? 'transactions_count' : 'transactions_count_one', { count });
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    const sub = this.sub();
    if (!sub) return;
    this.loading.set(true);
    this.loadError.set(null);
    this.api.byUser(sub).subscribe({
      next: (transactions) => {
        this.transactions.set(transactions);
        this.loading.set(false);
      },
      error: (error) => {
        this.loadError.set(loadErrorKey(error));
        this.loading.set(false);
      },
    });
  }
}
