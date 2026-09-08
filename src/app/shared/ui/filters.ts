import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, input, model, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { ListingFilters } from '../../core/models';
import { TRANSACTION_STATUS } from '../../core/transaction-status';
import { Icon } from '../icon/icon';
import { AirportInput } from './airport-input';
import { Button } from './button';
import { Modal } from './modal';
import { TextField } from './text-field';

/**
 * Filtres de recherche, portes de components/FilterModal.js.
 *
 * Le mobile n'avait que la modale, faute de place. Sur un grand ecran les
 * filtres restent visibles a cote des resultats — c'est la convention des
 * places de marche (Leboncoin, Vinted, BlaBlaCar) et ca evite l'aller-retour
 * modale / resultats a chaque essai. Sous 1024px, on retombe sur la modale.
 */
@Component({
  selector: 'bb-filters',
  imports: [NgTemplateOutlet, Icon, Modal, Button, AirportInput, TextField],
  template: `
    <ng-template #fields>
      <div class="pair">
        <bb-airport-input [label]="i18n.t('from')" placeholder="JFK" [(value)]="from" />
        <bb-airport-input [label]="i18n.t('to')" placeholder="CDG" [(value)]="to" />
      </div>

      <fieldset>
        <legend class="bb-section-title">{{ i18n.t('price_range') }}</legend>
        <div class="pair">
          <bb-text-field
            label="Min"
            type="number"
            [minValue]="0"
            [(value)]="minPrice"
            placeholder="0"
          />
          <bb-text-field
            label="Max"
            type="number"
            [minValue]="0"
            [(value)]="maxPrice"
            placeholder="50"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend class="bb-section-title">{{ i18n.t('weight_range') }}</legend>
        <div class="pair">
          <bb-text-field
            label="Min"
            type="number"
            [minValue]="0"
            [(value)]="minWeight"
            placeholder="0"
          />
          <bb-text-field
            label="Max"
            type="number"
            [minValue]="0"
            [(value)]="maxWeight"
            placeholder="30"
          />
        </div>
      </fieldset>

      @if (showStatusFilter()) {
        <label class="status">
          <span class="bb-section-title">{{ i18n.t('all_statuses') }}</span>
          <select [value]="filters().status ?? ''" (change)="onStatusChange($event)">
            <option value="">{{ i18n.t('all_statuses') }}</option>
            @for (status of statuses; track status.value) {
              <option [value]="status.value">{{ i18n.t(status.labelKey) }}</option>
            }
          </select>
        </label>
      }

      <div class="actions">
        <bb-button [text]="i18n.t('apply_filters')" (pressed)="apply()" />
        <button type="button" class="clear" (click)="clear()">
          <bb-icon name="eraser" [size]="18" />
          {{ i18n.t('clear_filters') }}
        </button>
      </div>
    </ng-template>

    @if (wide()) {
      <aside class="rail bb-rail-sticky" [attr.aria-label]="i18n.t('filters')">
        <h2 class="bb-card-title">
          <bb-icon name="filter" [size]="18" />
          {{ i18n.t('filters') }}
        </h2>
        <ng-container [ngTemplateOutlet]="fields" />
      </aside>
    } @else {
      <button type="button" class="trigger" (click)="open.set(true)">
        <bb-icon name="filter" [size]="18" />
        {{ i18n.t('filters') }}
      </button>

      <bb-modal
        [open]="open()"
        [title]="i18n.t('filters')"
        [closeLabel]="i18n.t('close')"
        (closed)="open.set(false)"
      >
        <ng-container [ngTemplateOutlet]="fields" />
      </bb-modal>
    }
  `,
  styles: `
    .rail {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
      background: var(--bb-card);
      border-radius: var(--bb-radius);
      box-shadow: var(--bb-shadow-card);
    }

    .rail h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: var(--bb-title);
    }

    .rail h2 bb-icon {
      color: var(--bb-primary);
    }

    .pair {
      display: flex;
      gap: 12px;
    }

    fieldset {
      border: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    legend {
      padding: 0;
      margin-bottom: 4px;
    }

    .status {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .status select {
      height: 44px;
      border: 1px solid transparent;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-input);
      color: var(--bb-title);
      padding: 0 10px;
      font: inherit;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .clear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 40px;
      border: none;
      border-radius: var(--bb-radius-sm);
      background: transparent;
      color: var(--bb-text);
      font-size: var(--bb-fs-body-2);
    }

    .clear:hover {
      background: var(--bb-input);
      color: var(--bb-title);
    }

    .trigger {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 40px;
      padding: 0 14px;
      border: 1px solid var(--bb-border);
      border-radius: var(--bb-radius-sm);
      background: var(--bb-card);
      color: var(--bb-title);
      font-size: var(--bb-fs-body-2);
      font-weight: 500;
    }
  `,
})
export class Filters {
  protected readonly i18n = inject(I18nService);

  readonly filters = model.required<ListingFilters>();
  readonly showStatusFilter = input(false);

  protected readonly open = signal(false);
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly minPrice = signal<string | number>('');
  protected readonly maxPrice = signal<string | number>('');
  protected readonly minWeight = signal<string | number>('');
  protected readonly maxWeight = signal<string | number>('');

  /** Rail a partir de 1024px, modale en dessous. */
  protected readonly wide = signal(false);

  protected readonly statuses = [
    { value: TRANSACTION_STATUS.WAITING_FOR_RESPONSE_BUYER, labelKey: 'waiting_for_response' },
    { value: TRANSACTION_STATUS.REQUEST_REJECTED, labelKey: 'request_rejected' },
    { value: TRANSACTION_STATUS.PAYMENT_REQUIRED, labelKey: 'payment_required' },
    { value: TRANSACTION_STATUS.RESERVATION_RECEIVED, labelKey: 'reservation_received' },
    { value: TRANSACTION_STATUS.AWAITING_PAYMENT, labelKey: 'awaiting_payment' },
    { value: TRANSACTION_STATUS.CONFIRMED, labelKey: 'confirmed' },
  ] as const;

  constructor() {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(min-width: 1024px)');
    this.wide.set(media.matches);
    media.addEventListener('change', (event) => this.wide.set(event.matches));
  }

  protected apply(): void {
    this.filters.update((current) => ({
      ...current,
      from: String(this.from()).trim().toUpperCase() || undefined,
      to: String(this.to()).trim().toUpperCase() || undefined,
      minPrice: this.toNumber(this.minPrice()),
      maxPrice: this.toNumber(this.maxPrice()),
      minWeight: this.toNumber(this.minWeight()),
      maxWeight: this.toNumber(this.maxWeight()),
    }));
    this.open.set(false);
  }

  protected clear(): void {
    this.from.set('');
    this.to.set('');
    this.minPrice.set('');
    this.maxPrice.set('');
    this.minWeight.set('');
    this.maxWeight.set('');
    this.filters.update((current) => ({ sort: current.sort }));
  }

  protected onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filters.update((current) => ({ ...current, status: value || null }));
  }

  private toNumber(raw: string | number): number | undefined {
    const value = typeof raw === 'number' ? raw : Number.parseFloat(raw);
    return Number.isFinite(value) ? value : undefined;
  }
}
