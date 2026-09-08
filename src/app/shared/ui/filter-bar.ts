import { Component, inject, input, model, output, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { ListingFilters, SortOption } from '../../core/models';
import { TRANSACTION_STATUS } from '../../core/transaction-status';
import { Icon } from '../icon/icon';
import { AirportInput } from './airport-input';
import { Button } from './button';
import { Modal } from './modal';
import { TextField } from './text-field';

/**
 * Portage de components/ActionBar.js + FilterModal.js : filtres, tri, statut et
 * remise a zero, poses sur l'en-tete degrade.
 */
@Component({
  selector: 'bb-filter-bar',
  imports: [Icon, Modal, Button, AirportInput, TextField],
  template: `
    <div class="bar">
      <button type="button" (click)="open.set(true)">
        <bb-icon name="filter" [size]="18" />
        {{ i18n.t('filters') }}
      </button>

      @if (showStatusFilter()) {
        <label class="select">
          <span class="sr-only">{{ i18n.t('all_statuses') }}</span>
          <select [value]="filters().status ?? ''" (change)="onStatusChange($event)">
            <option value="">{{ i18n.t('all_statuses') }}</option>
            @for (status of statuses; track status.value) {
              <option [value]="status.value">{{ i18n.t(status.labelKey) }}</option>
            }
          </select>
        </label>
      }

      <label class="select">
        <span class="sr-only">{{ i18n.t('sort') }}</span>
        <select [value]="filters().sort ?? ''" (change)="onSortChange($event)">
          <option value="">{{ i18n.t('sort') }}</option>
          @for (option of sortOptions; track option.value) {
            <option [value]="option.value">{{ i18n.t(option.labelKey) }}</option>
          }
        </select>
      </label>

      <button
        type="button"
        class="clear"
        [attr.aria-label]="i18n.t('clear_filters')"
        (click)="clear()"
      >
        <bb-icon name="eraser" [size]="18" />
      </button>
    </div>

    <bb-modal
      [open]="open()"
      [title]="i18n.t('filters')"
      [closeLabel]="i18n.t('close')"
      (closed)="open.set(false)"
    >
      <div class="row">
        <bb-airport-input
          [label]="i18n.t('from')"
          [placeholder]="i18n.t('origin')"
          [(value)]="from"
        />
        <bb-airport-input
          [label]="i18n.t('to')"
          [placeholder]="i18n.t('destination')"
          [(value)]="to"
        />
      </div>

      <fieldset>
        <legend class="bb-card-title">{{ i18n.t('price_range') }}</legend>
        <div class="row">
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
        <legend class="bb-card-title">{{ i18n.t('weight_range') }}</legend>
        <div class="row">
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

      <bb-button [text]="i18n.t('apply_filters')" (pressed)="apply()" />
    </bb-modal>
  `,
  styles: `
    .bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .bar button,
    .bar select {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: none;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.18);
      color: var(--bb-white);
      font-size: var(--bb-fs-body-2);
      font-weight: 500;
    }

    .bar select option {
      color: var(--bb-title);
      background: var(--bb-card);
    }

    .bar button:hover,
    .bar select:hover {
      background: rgba(0, 0, 0, 0.3);
    }

    .bar .clear {
      background: var(--bb-error-strong);
    }

    .row {
      display: flex;
      gap: 12px;
    }

    fieldset {
      border: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    legend {
      padding: 0;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  `,
})
export class FilterBar {
  protected readonly i18n = inject(I18nService);

  readonly filters = model.required<ListingFilters>();
  readonly showStatusFilter = input(false);
  readonly cleared = output<void>();

  protected readonly open = signal(false);
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly minPrice = signal('');
  protected readonly maxPrice = signal('');
  protected readonly minWeight = signal('');
  protected readonly maxWeight = signal('');

  protected readonly sortOptions = [
    { value: 'recent', labelKey: 'sort_recent' },
    { value: 'earliest_departure', labelKey: 'sort_earliest_departure' },
    { value: 'price_low', labelKey: 'sort_price_low' },
    { value: 'price_high', labelKey: 'sort_price_high' },
    { value: 'weight_high', labelKey: 'sort_weight_high' },
    { value: 'weight_low', labelKey: 'sort_weight_low' },
  ] as const;

  protected readonly statuses = [
    { value: TRANSACTION_STATUS.WAITING_FOR_RESPONSE_BUYER, labelKey: 'waiting_for_response' },
    { value: TRANSACTION_STATUS.REQUEST_REJECTED, labelKey: 'request_rejected' },
    { value: TRANSACTION_STATUS.PAYMENT_REQUIRED, labelKey: 'payment_required' },
    { value: TRANSACTION_STATUS.RESERVATION_RECEIVED, labelKey: 'reservation_received' },
    { value: TRANSACTION_STATUS.AWAITING_PAYMENT, labelKey: 'awaiting_payment' },
    { value: TRANSACTION_STATUS.CONFIRMED, labelKey: 'confirmed' },
  ] as const;

  protected apply(): void {
    this.filters.update((current) => ({
      ...current,
      from: this.from().trim() || undefined,
      to: this.to().trim() || undefined,
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
    this.filters.set({});
    this.cleared.emit();
  }

  protected onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filters.update((current) => ({ ...current, sort: (value || null) as SortOption | null }));
  }

  protected onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filters.update((current) => ({ ...current, status: value || null }));
  }

  private toNumber(raw: string): number | undefined {
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : undefined;
  }
}
