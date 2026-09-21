import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LoadErrorKey, loadErrorKey } from '../../core/api/load-error';
import { TripAlert, TripsService } from '../../core/api/trips.service';
import { ConfirmService } from '../../core/confirm.service';
import { CurrencyService } from '../../core/currency.service';
import { formatLocalizedDate } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { IconButton } from '../../shared/ui/icon-button';
import { LoadError } from '../../shared/ui/load-error';
import { Loader } from '../../shared/ui/loader';
import { SubHeader } from '../../shared/ui/sub-header';

/**
 * Alertes de trajet du membre. Une alerte se cree depuis l'accueil, a partir
 * des filtres ; ici on les relit et on les supprime.
 */
@Component({
  selector: 'bb-alerts-page',
  imports: [SubHeader, Icon, IconButton, Loader, LoadError],
  template: `
    <bb-sub-header [title]="i18n.t('my_alerts')" (back)="goBack()" />

    <div class="bb-page content">
      <p class="bb-body-2 lede">{{ i18n.t('alerts_lede') }}</p>

      @if (loading()) {
        <bb-loader [label]="i18n.t('loading')" />
      } @else if (loadError(); as error) {
        <bb-load-error [messageKey]="error" (retry)="load()" />
      } @else if (!alerts().length) {
        <p class="bb-empty">{{ i18n.t('no_alerts') }}</p>
      } @else {
        <ul class="list">
          @for (alert of alerts(); track alert.id) {
            <li class="bb-card alert">
              <bb-icon name="bell" [size]="20" />
              <div class="what">
                <span class="bb-code route"
                  >{{ alert.departureAirport }} → {{ alert.arrivalAirport }}</span
                >
                <span class="bb-body-2">{{ describe(alert) }}</span>
              </div>
              <bb-icon-button
                data-variant="danger"
                icon="trash-2"
                [iconSize]="18"
                [label]="
                  i18n.t('delete_alert', {
                    route: alert.departureAirport + ' → ' + alert.arrivalAirport,
                  })
                "
                (pressed)="remove(alert)"
              />
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: `
    .content {
      padding-top: 24px;
      padding-bottom: 48px;
    }

    .lede {
      margin: 0 0 20px;
      max-width: 62ch;
    }

    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .alert > bb-icon {
      color: var(--bb-primary);
    }

    .what {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .route {
      font-size: 1.5rem;
      color: var(--bb-title);
    }
  `,
})
export class AlertsPage {
  protected readonly i18n = inject(I18nService);
  private readonly trips = inject(TripsService);
  private readonly currency = inject(CurrencyService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);

  protected readonly alerts = signal<TripAlert[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<LoadErrorKey | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.trips.myAlerts().subscribe({
      next: (alerts) => {
        this.alerts.set(alerts);
        this.loading.set(false);
      },
      error: (error) => {
        this.loadError.set(loadErrorKey(error));
        this.loading.set(false);
      },
    });
  }

  /** « Autour du 3 oct. 2026 (± 3 jours) · 12 € / kg max · 5 kg min », ou « Toutes les dates ». */
  protected describe(alert: TripAlert): string {
    const parts: string[] = [];
    if (alert.date) {
      const day = formatLocalizedDate(alert.date, this.i18n.language());
      parts.push(
        alert.flexDays
          ? this.i18n.t('alert_date_flex', { date: day, days: alert.flexDays })
          : this.i18n.t('alert_date_exact', { date: day }),
      );
    } else {
      parts.push(this.i18n.t('alert_any_date'));
    }
    if (alert.maxPricePerKg) {
      parts.push(
        this.i18n.t('alert_max_price', { price: this.currency.format(alert.maxPricePerKg) }),
      );
    }
    if (alert.minWeight) {
      parts.push(this.i18n.t('alert_min_weight', { weight: alert.minWeight }));
    }
    return parts.join(' · ');
  }

  protected async remove(alert: TripAlert): Promise<void> {
    const route = `${alert.departureAirport} → ${alert.arrivalAirport}`;
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('delete_alert', { route }),
      message: this.i18n.t('delete_alert_message'),
      confirmText: this.i18n.t('confirm'),
      cancelText: this.i18n.t('cancel'),
      tone: 'error',
    });
    if (!confirmed) return;
    try {
      await firstValueFrom(this.trips.deleteAlert(alert.id));
      this.alerts.update((alerts) => alerts.filter((item) => item.id !== alert.id));
    } catch {
      this.confirm.inform(this.i18n.t('error'), this.i18n.t('error_alert_delete_failed'));
    }
  }

  protected goBack(): void {
    history.length > 1 ? history.back() : void this.router.navigate(['/profile']);
  }
}
