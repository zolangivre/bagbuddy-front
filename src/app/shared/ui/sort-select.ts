import { Component, inject, model } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { SortOption } from '../../core/models';
import { T } from './t';

/**
 * Tri des resultats. Sur mobile c'etait une modale de plus ; sur le web il a sa
 * place au-dessus de la liste, a cote du nombre de resultats.
 */
@Component({
  selector: 'bb-sort-select',
  imports: [T],
  template: `
    <label>
      <span class="bb-body-2"><bb-t key="sort" /></span>
      <select [value]="sort() ?? ''" (change)="onChange($event)">
        <option value="">—</option>
        @for (option of options; track option.value) {
          <option [value]="option.value">{{ i18n.t(option.labelKey) }}</option>
        }
      </select>
    </label>
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
    }

    /* Largeur fixe pour l'ensemble « libelle + liste » : un <select> se
       dimensionne sinon sur sa plus longue option, donc sur la langue, et
       pousse la ligne de resultats en changeant de langue. */
    label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: 17.5rem;
      max-width: 100%;
    }

    select {
      flex: 1;
      min-width: 0;
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
