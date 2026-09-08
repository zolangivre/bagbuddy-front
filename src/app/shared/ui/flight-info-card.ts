import { Component, computed, inject, input } from '@angular/core';
import { formatLocalizedDate, formatLocalizedTime } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { ListingInfo } from '../../core/models';
import { Icon } from '../icon/icon';
import { Badge } from './badge';

/** Portage de components/FlightInfoCard.js. */
@Component({
  selector: 'bb-flight-info-card',
  imports: [Icon, Badge],
  template: `
    <div class="flight">
      <div class="route">
        <div class="airport">
          <span class="bb-title-md">{{ item().departureAirport }}</span>
          <span class="bb-body-3">{{ i18n.t('departure') }}</span>
        </div>
        <div class="arrow">
          <bb-icon name="arrow-right" [size]="20" />
          <span class="line"></span>
        </div>
        <div class="airport">
          <span class="bb-title-md">{{ item().arrivalAirport }}</span>
          <span class="bb-body-3">{{ i18n.t('arrival') }}</span>
        </div>
      </div>

      <div class="line-row">
        <span class="icon-time">
          <bb-icon name="plane-takeoff" [size]="16" />
          {{ times().departureTime }}
        </span>
        <bb-badge
          [text]="times().departureDate"
          background="var(--bb-card)"
          color="var(--bb-title)"
          borderColor="var(--bb-border)"
        />
      </div>

      <div class="line-row">
        <span class="icon-time">
          <bb-icon name="plane-landing" [size]="16" />
          {{ times().arrivalTime }}
        </span>
        <bb-badge
          [text]="times().arrivalDate"
          background="var(--bb-card)"
          color="var(--bb-title)"
          borderColor="var(--bb-border)"
        />
      </div>
    </div>
  `,
  styles: `
    .flight {
      padding: 16px;
      border-radius: var(--bb-radius);
      background: var(--bb-subtle);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .route {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .airport {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .arrow {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: var(--bb-primary);
    }

    .line {
      width: 32px;
      height: 1px;
      background: var(--bb-cyan-a20);
    }

    .line-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }

    .icon-time {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--bb-text);
      font-size: var(--bb-fs-body-2);
    }

    .icon-time bb-icon {
      color: var(--bb-primary);
    }
  `,
})
export class FlightInfoCard {
  protected readonly i18n = inject(I18nService);
  readonly item = input.required<ListingInfo>();

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
}
