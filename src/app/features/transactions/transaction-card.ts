import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyService } from '../../core/currency.service';
import { formatLocalizedDate, formatLocalizedTime, initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Transaction } from '../../core/models';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/ui/avatar';
import { Badge } from '../../shared/ui/badge';
import { StatusBadge } from '../../shared/ui/status-badge';

/**
 * Ligne de transaction, portee de components/TransactionCard.js.
 *
 * Sur mobile chaque transaction etait une carte haute qu'on faisait defiler.
 * Ici c'est une ligne large aux colonnes fixes (interlocuteur, trajet, poids,
 * montant, statut) : d'une ligne a l'autre l'oeil retrouve la meme position,
 * ce qui rend la liste scannable — ce qu'un ecran large permet et pas un
 * telephone.
 */
@Component({
  selector: 'bb-transaction-card',
  imports: [RouterLink, Avatar, Badge, StatusBadge, Icon],
  template: `
    <a
      class="row"
      routerLink="/transaction-detail"
      [queryParams]="{ transactionId: transaction().id }"
    >
      <span class="who">
        <bb-avatar [initials]="initials()" [size]="40" />
        <span class="who-text">
          <span class="bb-section-title">{{ counterpartName() }}</span>
          <bb-badge
            [text]="i18n.t(isSelling() ? 'selling' : 'buying')"
            [background]="isSelling() ? 'var(--bb-green-a10)' : 'var(--bb-cyan-a10)'"
            [color]="isSelling() ? 'var(--bb-success)' : 'var(--bb-primary)'"
          />
        </span>
      </span>

      <span class="route">
        <span class="leg">
          <span class="bb-code code">{{ transaction().listingInfo.departureAirport }}</span>
          <bb-icon name="arrow-right" [size]="16" />
          <span class="bb-code code">{{ transaction().listingInfo.arrivalAirport }}</span>
        </span>
        <span class="bb-body-3">{{ departure() }}</span>
      </span>

      <span class="figure">
        <span class="bb-body-3 label">{{ i18n.t('weight') }}</span>
        <span class="bb-time">{{ transaction().weight }} kg</span>
      </span>

      <span class="figure figure--total">
        <span class="bb-body-3 label">{{ i18n.t('total') }}</span>
        <strong class="bb-number">{{ currency.format(transaction().total) }}</strong>
      </span>

      <span class="status">
        <bb-status-badge [status]="status()" />
        <bb-icon name="arrow-right" [size]="16" />
      </span>
    </a>
  `,
  styles: `
    .row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      padding: 18px 20px;
      background: var(--bb-card);
      border-radius: var(--bb-radius);
      box-shadow: var(--bb-shadow-card);
      transition: box-shadow 0.15s ease;
    }

    .row:hover {
      box-shadow: var(--bb-shadow-raised);
    }

    .who {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .who-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      min-width: 0;
    }

    .route {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .leg {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--bb-primary);
    }

    .code {
      font-size: 1.375rem;
    }

    .figure {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      color: var(--bb-text);
    }

    @media (min-width: 900px) {
      .row {
        grid-template-columns: var(--bb-tx-columns);
        align-items: center;
        gap: 20px;
      }

      /* Les intitules deviennent l'en-tete de la liste : inutile de les
         repeter sur chaque ligne. */
      .label {
        display: none;
      }

      .figure--total {
        text-align: right;
        align-items: flex-end;
      }

      .status {
        justify-content: flex-end;
      }
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

  protected readonly departure = computed(() => {
    const lang = this.i18n.language();
    const date = this.transaction().listingInfo.departureDate;
    return `${formatLocalizedDate(date, lang)} · ${formatLocalizedTime(date, lang)}`;
  });
}
