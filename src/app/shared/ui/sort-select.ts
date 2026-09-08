import { Component, inject, model } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { SortOption } from '../../core/models';

/**
 * Tri des resultats. Sur mobile c'etait une modale de plus ; sur le web il a sa
 * place au-dessus de la liste, a cote du nombre de resultats.
 */
@Component({
  selector: 'bb-sort-select',
  template: `
    <label>
      <span class="bb-body-2">{{ i18n.t('sort') }}</span>
      <select [value]="sort() ?? ''" (change)="onChange($event)">
        <option value="">—</option>
        @for (option of options; track option.value) {
          <option [value]="option.value">{{ i18n.t(option.labelKey) }}</option>
        }
      </select>
    </label>
  `,
  styles: `
    label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    select {
      height: 40px;
      border: 1px solid var(--bb-border);
      border-radius: var(--bb-radius-sm);
      background: var(--bb-card);
      color: var(--bb-title);
      padding: 0 10px;
      font: inherit;
      font-size: var(--bb-fs-body-2);
    }
  `,
})
export class SortSelect {
  protected readonly i18n = inject(I18nService);
  readonly sort = model<SortOption | null>(null);

  protected readonly options = [
    { value: 'recent', labelKey: 'sort_recent' },
    { value: 'earliest_departure', labelKey: 'sort_earliest_departure' },
    { value: 'price_low', labelKey: 'sort_price_low' },
    { value: 'price_high', labelKey: 'sort_price_high' },
    { value: 'weight_high', labelKey: 'sort_weight_high' },
    { value: 'weight_low', labelKey: 'sort_weight_low' },
  ] as const;

  protected onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sort.set((value || null) as SortOption | null);
  }
}
