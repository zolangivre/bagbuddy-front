import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GraphQlError } from '../../core/api/graphql.client';
import { loadErrorKeyOr } from '../../core/api/load-error';
import { TripsService } from '../../core/api/trips.service';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { ListingFilters } from '../../core/models';
import { Icon } from '../../shared/icon/icon';

type State = 'idle' | 'saving' | 'created' | 'failed';

/**
 * « M'alerter » sur le trajet filtre : la recherche reste ouverte, et un email
 * part a chaque annonce publiee qui correspond.
 *
 * Propose seulement quand un trajet est choisi (depart et arrivee) : c'est le
 * minimum pour qu'une alerte ait un sens. Elle reprend les autres filtres
 * (date et flexibilite, prix maximum, poids minimum). Le resultat est annonce
 * dans une region polie, sans deplacer le focus.
 */
@Component({
  selector: 'bb-alert-cta',
  imports: [Icon, RouterLink],
  template: `
    @if (route(); as current) {
      <div class="cta">
        <bb-icon name="bell" [size]="20" />
        <p class="bb-body-2 text" aria-live="polite">
          @switch (state()) {
            @case ('created') {
              {{ i18n.t('alert_created', { route: current }) }}
              <a class="bb-highlight" routerLink="/alerts">{{ i18n.t('manage_alerts') }}</a>
            }
            @case ('failed') {
              <span class="error">{{ i18n.t(failure()) }}</span>
            }
            @default {
              {{ i18n.t('alert_prompt', { route: current }) }}
            }
          }
        </p>
        @if (state() !== 'created') {
          <button type="button" [disabled]="state() === 'saving'" (click)="create()">
            {{ i18n.t('alert_create') }}
          </button>
        }
      </div>
    }
  `,
  styles: `
    .cta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px 14px;
      padding: 12px 16px;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-cyan-a10);
      color: var(--bb-title);
    }

    .cta > bb-icon {
      flex: none;
      color: var(--bb-primary);
    }

    .text {
      flex: 1;
      min-width: 12rem;
      margin: 0;
    }

    .text a {
      margin-left: 6px;
      font-size: inherit;
    }

    .error {
      color: var(--bb-error);
    }

    button {
      min-height: 40px;
      padding: 0 14px;
      border: none;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-primary-strong);
      color: var(--bb-white);
      font-weight: 500;
      white-space: nowrap;
    }

    button:disabled {
      opacity: 0.55;
    }
  `,
})
export class AlertCta {
  protected readonly i18n = inject(I18nService);
  private readonly trips = inject(TripsService);

  readonly filters = input.required<ListingFilters>();

  protected readonly route = computed(() => {
    const { from, to } = this.filters();
    return from && to ? `${from} → ${to}` : null;
  });

  /** Repart de zero quand les filtres changent : l'alerte creee etait pour l'autre recherche. */
  protected readonly state = linkedSignal<ListingFilters, State>({
    source: this.filters,
    computation: () => 'idle',
  });

  /** Message du dernier echec ; lu seulement en etat « failed ». */
  protected readonly failure = signal<TranslationKey>('error_alert_failed');

  protected async create(): Promise<void> {
    if (this.state() === 'saving') return;
    this.state.set('saving');
    try {
      await firstValueFrom(this.trips.createAlert(this.filters(), this.i18n.language()));
      this.state.set('created');
    } catch (cause) {
      const code = cause instanceof GraphQlError ? cause.code : undefined;
      if (code === 'too_many_alerts') this.failure.set('error_too_many_alerts');
      else if (code === 'alert_needs_email') this.failure.set('error_alert_needs_email');
      else this.failure.set(loadErrorKeyOr(cause, 'error_alert_failed'));
      this.state.set('failed');
    }
  }
}
