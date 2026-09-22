import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyService } from '../../core/currency.service';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Role, SettlementStatus, Transaction } from '../../core/models';
import { Icon } from '../../shared/icon/icon';

/**
 * Ce que la transaction a rapporte ou rendu, une fois reglee : le versement du
 * voyageur (commission deduite), ou le remboursement de l'acheteur.
 *
 * Montants en unites mineures cote back (comme stripeAmount), convertis ici.
 * AWAITING_ACCOUNT est le seul etat qui demande un geste : le voyageur n'a pas
 * encore de compte de versement, on l'y envoie.
 */
@Component({
  selector: 'bb-settlement-card',
  imports: [Icon, RouterLink],
  template: `
    @if (line(); as current) {
      <section class="bb-card">
        <h2 class="bb-card-title">
          <bb-icon name="banknote" [size]="22" />
          {{ i18n.t(current.titleKey) }}
        </h2>
        <p class="amount bb-amount">{{ current.amount }}</p>
        <p class="bb-body-2 state">{{ i18n.t(current.stateKey) }}</p>
        @if (current.fee) {
          <p class="bb-body-3 fee">{{ i18n.t('settlement_fee', { fee: current.fee }) }}</p>
        }
        @if (current.needsAccount) {
          <a class="bb-highlight setup" routerLink="/account" fragment="payouts">
            {{ i18n.t('payouts_setup') }}
            <bb-icon name="arrow-right" [size]="18" />
          </a>
        }
      </section>
    }
  `,
  styles: `
    .bb-card {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 4px;
      color: var(--bb-title);
    }

    h2 bb-icon {
      color: var(--bb-success);
    }

    .amount {
      margin: 0;
      font-size: 2rem;
      color: var(--bb-title);
    }

    .state,
    .fee {
      margin: 0;
    }

    .setup {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
      font-size: var(--bb-fs-body-2);
    }
  `,
})
export class SettlementCard {
  protected readonly i18n = inject(I18nService);
  private readonly currency = inject(CurrencyService);

  readonly transaction = input.required<Transaction>();
  readonly role = input.required<Role>();

  protected readonly line = computed(() => {
    const tx = this.transaction();
    const format = (minor?: number | null) => this.currency.format((minor ?? 0) / 100);
    if (this.role() === 'seller' && tx.payoutStatus) {
      return {
        titleKey: 'settlement_payout_title' as TranslationKey,
        amount: format(tx.payoutAmount),
        stateKey: stateKey('payout', tx.payoutStatus),
        fee: tx.platformFee ? format(tx.platformFee) : null,
        needsAccount: tx.payoutStatus === 'AWAITING_ACCOUNT',
      };
    }
    if (this.role() === 'buyer' && tx.refundStatus) {
      return {
        titleKey: 'settlement_refund_title' as TranslationKey,
        amount: format(tx.refundAmount),
        stateKey: stateKey('refund', tx.refundStatus),
        fee: null,
        needsAccount: false,
      };
    }
    return null;
  });
}

function stateKey(kind: 'payout' | 'refund', status: SettlementStatus): TranslationKey {
  switch (status) {
    case 'DONE':
      return kind === 'payout' ? 'settlement_payout_done' : 'settlement_refund_done';
    case 'SIMULATED':
      return 'settlement_simulated';
    case 'AWAITING_ACCOUNT':
      return 'settlement_awaiting_account';
    case 'FAILED':
      return 'settlement_failed';
    default:
      return 'settlement_pending';
  }
}
