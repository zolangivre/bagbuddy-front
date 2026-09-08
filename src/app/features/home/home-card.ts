import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyService } from '../../core/currency.service';
import { formatLocalizedDate, initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Listing } from '../../core/models';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/ui/avatar';
import { FlightInfoCard } from '../../shared/ui/flight-info-card';
import { RoundIcon } from '../../shared/ui/round-icon';

/** Portage de components/HomeCard.js : une annonce dans la liste d'achat. */
@Component({
  selector: 'bb-home-card',
  imports: [RouterLink, Avatar, FlightInfoCard, RoundIcon, Icon],
  template: `
    <article class="bb-card">
      <a class="user" [routerLink]="['/profile-view', item().userInfo.sub]">
        <bb-avatar [initials]="initials()" />
        <span class="user-text">
          <span class="bb-section-title">{{ item().userInfo.name }}</span>
          <span class="bb-body-2">{{ i18n.t('listed_on') }} : {{ listedOn() }}</span>
        </span>
      </a>

      <bb-flight-info-card [item]="item()" />

      <div class="weight-price">
        <div class="weight">
          <bb-round-icon icon="weight" [size]="32" />
          <span>
            <span class="bb-body">{{ i18n.t('available_weight') }}</span>
            <strong class="bb-title-md">{{ item().remainingWeight }} kg</strong>
          </span>
        </div>
        <div class="price">
          <span class="bb-body">{{ i18n.t('price_per_kg') }}</span>
          <strong class="bb-number">{{ currency.format(item().pricePerKg) }}</strong>
        </div>
      </div>

      <div class="total">
        <span class="bb-body">{{ i18n.t('total_for') }} {{ item().remainingWeight }} kg</span>
        <strong class="bb-number">{{ currency.format(total()) }}</strong>
      </div>

      @if (isOwnListing()) {
        <a class="cta" routerLink="/listings">
          {{ i18n.t('view_your_listings') }}
          <bb-icon name="arrow-right" [size]="24" />
        </a>
      } @else {
        <a class="cta" routerLink="/transaction-detail" [queryParams]="{ listingId: item().id }">
          {{ i18n.t('reserve_weight') }}
          <bb-icon name="arrow-right" [size]="24" />
        </a>
      }
    </article>
  `,
  styles: `
    .bb-card {
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100%;
    }

    .user {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user:hover .bb-section-title {
      color: var(--bb-primary);
    }

    .user-text {
      display: flex;
      flex-direction: column;
    }

    .weight-price {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .weight {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .weight span span,
    .weight strong,
    .price span,
    .price strong {
      display: block;
    }

    .price {
      text-align: right;
    }

    .total {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border-radius: var(--bb-radius);
      background: rgba(14, 165, 233, 0.05);
      border: 1px solid rgba(14, 165, 233, 0.1);
    }

    .cta {
      margin-top: auto;
      min-height: 48px;
      border-radius: var(--bb-radius);
      background: var(--bb-primary-strong);
      color: var(--bb-white);
      font-size: 1.125rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      box-shadow: var(--bb-shadow-button);
    }

    .cta:hover {
      filter: brightness(1.06);
    }
  `,
})
export class HomeCard {
  protected readonly i18n = inject(I18nService);
  protected readonly currency = inject(CurrencyService);
  private readonly auth = inject(AuthService);

  readonly item = input.required<Listing>();

  protected readonly initials = computed(() => {
    const user = this.item().userInfo;
    return user.given_name && user.family_name
      ? `${user.given_name[0]}${user.family_name[0]}`.toUpperCase()
      : initialsOf(user.name, 'NN');
  });

  protected readonly listedOn = computed(() =>
    formatLocalizedDate(this.item().createdAt, this.i18n.language()),
  );

  protected readonly total = computed(() => this.item().remainingWeight * this.item().pricePerKg);

  protected readonly isOwnListing = computed(
    () => this.item().userInfo.sub === this.auth.userInfo()?.sub,
  );
}
