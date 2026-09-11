import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyService } from '../../core/currency.service';
import {
  formatLocalizedDate,
  formatLocalizedDateTime,
  formatLocalizedTime,
} from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { T } from '../../shared/ui/t';
import { Listing } from '../../core/models';
import { Icon } from '../../shared/icon/icon';

/** Portage de components/ListingCard.js : une de mes annonces, cliquable. */
@Component({
  selector: 'bb-listing-card',
  imports: [T, RouterLink, Icon],
  template: `
    <a class="bb-card" [routerLink]="['/listings', item().id, 'edit']">
      <span class="bb-body-2">{{ i18n.t('listed_on') }} : {{ createdAt() }}</span>

      <div class="route">
        <span class="airport">
          <strong class="bb-card-title">{{ item().departureAirport }}</strong>
          <span class="bb-body-2">{{ airports().departure }}</span>
        </span>
        <bb-icon name="arrow-right" [size]="24" />
        <span class="airport right">
          <strong class="bb-card-title">{{ item().arrivalAirport }}</strong>
          <span class="bb-body-2">{{ airports().arrival }}</span>
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

      <div class="conditions">
        <span class="head">
          <bb-icon name="notepad-text" [size]="16" />
          <span class="bb-card-title">{{ i18n.t('conditions') }}</span>
        </span>
        <p class="bb-body-2">{{ item().conditions || i18n.t('no_conditions') }}</p>
      </div>

      <div class="footer">
        <span class="left">
          <bb-icon name="scale" [size]="16" />
          <span class="bb-card-title">{{ item().remainingWeight }}kg <bb-t key="available" /></span>
        </span>
        <span class="bb-number">{{ currency.format(item().pricePerKg) }}/kg</span>
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

    .route {
      display: flex;
      align-items: center;
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

    /* Deux moities egales plutot que deux blocs a la largeur de leur texte :
       la date et l'heure changent de format avec la langue (« 06:00 PM » vs
       « 18:00 »), la colonne, elle, ne doit pas bouger. */
    .times {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      gap: 12px;
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

    .conditions {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .conditions .head {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--bb-primary);
    }

    .conditions p {
      margin: 0;
      text-align: justify;
    }

    .footer {
      margin-top: auto;
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
  `,
})
export class ListingCard {
  protected readonly i18n = inject(I18nService);
  protected readonly currency = inject(CurrencyService);

  readonly item = input.required<Listing>();
  /** Noms d'aeroports resolus par la page (la table complete est chargee a la demande). */
  readonly airportNames = input<{ departure: string; arrival: string } | null>(null);

  protected readonly airports = computed(
    () => this.airportNames() ?? { departure: '???', arrival: '???' },
  );

  protected readonly createdAt = computed(() =>
    formatLocalizedDateTime(this.item().createdAt, this.i18n.language()),
  );

  protected readonly dates = computed(() => {
    const item = this.item();
    const lang = this.i18n.language();
    return {
      departureDate: formatLocalizedDate(item.departureDate, lang),
      departureTime: formatLocalizedTime(item.departureDate, lang),
      arrivalDate: formatLocalizedDate(item.arrivalDate, lang),
      arrivalTime: formatLocalizedTime(item.arrivalDate, lang),
    };
  });
}
