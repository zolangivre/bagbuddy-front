import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyService } from '../../core/currency.service';
import { formatLocalizedDate, formatLocalizedTime, initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Listing } from '../../core/models';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/ui/avatar';

/**
 * Annonce de l'accueil, portee de components/HomeCard.js.
 *
 * Sur mobile c'etait une carte verticale empilee. Ici elle prend la forme
 * qu'elle avait deja en germe : une carte d'embarquement — trajet a gauche,
 * perforation, talon a droite avec le poids, le prix et l'action. C'est une
 * forme large, qui n'a de sens que sur un ecran large ; sous 900px elle
 * repasse en pile et la perforation devient horizontale.
 */
@Component({
  selector: 'bb-home-card',
  imports: [RouterLink, Avatar, Icon],
  template: `
    <article class="pass">
      <div class="trip">
        <a class="user" [routerLink]="['/profile-view', item().userInfo.sub]">
          <bb-avatar [initials]="initials()" [size]="40" />
          <span class="user-text">
            <span class="bb-section-title">{{ item().userInfo.name }}</span>
            <span class="bb-body-3">{{ i18n.t('listed_on') }} {{ listedOn() }}</span>
          </span>
        </a>

        <div class="route">
          <div class="end">
            <span class="bb-code">{{ item().departureAirport }}</span>
            <span class="bb-time">{{ times().departureTime }}</span>
            <span class="bb-body-3">{{ times().departureDate }}</span>
          </div>

          <div class="leg" aria-hidden="true">
            <span class="dash"></span>
            <bb-icon name="plane" [size]="18" />
            <span class="dash"></span>
          </div>

          <div class="end end--arrival">
            <span class="bb-code">{{ item().arrivalAirport }}</span>
            <span class="bb-time">{{ times().arrivalTime }}</span>
            <span class="bb-body-3">{{ times().arrivalDate }}</span>
          </div>
        </div>

        @if (item().conditions) {
          <p class="conditions bb-body-2">{{ item().conditions }}</p>
        }
      </div>

      <div class="stub">
        <div class="figures">
          <div class="figure">
            <span class="bb-body-3">{{ i18n.t('available_weight') }}</span>
            <span class="bb-amount">{{ item().remainingWeight }} kg</span>
          </div>
          <div class="figure">
            <span class="bb-body-3">{{ i18n.t('price_per_kg') }}</span>
            <span class="bb-amount">{{ currency.format(item().pricePerKg) }}</span>
          </div>
        </div>

        <div class="total">
          <!-- Pas de reservation de largeur ici : le libelle precede le nombre,
               reserver la place du francais creuserait un blanc visible entre
               les deux. La boite est calee a gauche, elle ne deplace rien. -->
          <span class="bb-body-3">{{ i18n.t('total_for') }} {{ item().remainingWeight }} kg</span>
          <strong class="bb-number">{{ currency.format(total()) }}</strong>
        </div>

        @if (isOwnListing()) {
          <a class="cta" routerLink="/listings">
            {{ i18n.t('view_your_listings') }}
            <bb-icon name="arrow-right" [size]="20" />
          </a>
        } @else {
          <a class="cta" routerLink="/transaction-detail" [queryParams]="{ listingId: item().id }">
            {{ i18n.t('reserve_weight') }}
            <bb-icon name="arrow-right" [size]="20" />
          </a>
        }
      </div>
    </article>
  `,
  styles: `
    .pass {
      display: grid;
      grid-template-columns: 1fr;
      background: var(--bb-card);
      border-radius: var(--bb-radius);
      box-shadow: var(--bb-shadow-card);
      overflow: hidden;
    }

    .trip {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .user {
      display: flex;
      align-items: center;
      gap: 12px;
      width: fit-content;
    }

    .user:hover .bb-section-title {
      color: var(--bb-primary);
    }

    .user-text {
      display: flex;
      flex-direction: column;
    }

    .route {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .end {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .end--arrival {
      text-align: right;
    }

    /* Le trait pointille et l'avion reprennent le motif du billet. */
    .leg {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--bb-primary);
    }

    .dash {
      flex: 1;
      height: 0;
      border-top: 2px dashed var(--bb-cyan-a20);
    }

    .conditions {
      margin: 0;
      max-width: 62ch;
      color: var(--bb-text);
    }

    .stub {
      position: relative;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: var(--bb-cyan-a05);
      border-top: 2px dashed var(--bb-border);
    }

    /* Les encoches de la perforation : deux disques a la couleur du fond. */
    .stub::before,
    .stub::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      background: var(--bb-background);
      top: -12px;
    }

    .stub::before {
      left: -10px;
    }

    .stub::after {
      right: -10px;
    }

    .figures {
      display: flex;
      gap: 24px;
    }

    .figure {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .total {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--bb-cyan-a20);
    }

    .cta {
      min-height: 44px;
      padding: 0 18px;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-primary-strong);
      color: var(--bb-white);
      font-size: var(--bb-fs-body);
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: var(--bb-shadow-button);
    }

    .cta:hover {
      filter: brightness(1.08);
    }

    @media (min-width: 900px) {
      .pass {
        grid-template-columns: minmax(0, 1fr) 280px;
      }

      .trip {
        padding: 24px 28px;
      }

      .stub {
        border-top: none;
        border-left: 2px dashed var(--bb-border);
        justify-content: space-between;
      }

      .stub::before,
      .stub::after {
        top: auto;
        left: -12px;
        right: auto;
      }

      .stub::before {
        top: -10px;
      }

      .stub::after {
        bottom: -10px;
      }

      .figures {
        flex-direction: column;
        gap: 14px;
      }
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
    return user.givenName && user.familyName
      ? `${user.givenName[0]}${user.familyName[0]}`.toUpperCase()
      : initialsOf(user.name, 'NN');
  });

  protected readonly listedOn = computed(() =>
    formatLocalizedDate(this.item().createdAt, this.i18n.language()),
  );

  protected readonly times = computed(() => {
    const item = this.item();
    const lang = this.i18n.language();
    return {
      departureDate: formatLocalizedDate(item.departureDate, lang),
      departureTime: formatLocalizedTime(item.departureDate, lang),
      arrivalDate: formatLocalizedDate(item.arrivalDate, lang),
      arrivalTime: formatLocalizedTime(item.arrivalDate, lang),
    };
  });

  protected readonly total = computed(() => this.item().remainingWeight * this.item().pricePerKg);

  protected readonly isOwnListing = computed(
    () => this.item().userInfo.sub === this.auth.userInfo()?.sub,
  );
}
