import { Component, computed, input, model, signal } from '@angular/core';
import type { Airport } from '../../core/airports';

/**
 * Selection d'aeroport par code IATA. La liste complete (8500+ entrees, reprise
 * telle quelle du mobile) est chargee en import dynamique au premier focus pour
 * ne pas peser sur le bundle initial.
 */
@Component({
  selector: 'bb-airport-input',
  template: `
    <label class="field">
      @if (label()) {
        <span class="bb-body-2">{{ label() }}</span>
      }
      <input
        type="text"
        [attr.list]="listId"
        [value]="value()"
        [placeholder]="placeholder()"
        [attr.aria-invalid]="!!error()"
        [attr.aria-describedby]="error() ? listId + '-error' : null"
        maxlength="3"
        autocomplete="off"
        (focus)="loadAirports()"
        (input)="onInput($event)"
      />
      <datalist [id]="listId">
        @for (airport of suggestions(); track airport.value) {
          <option [value]="airport.value">{{ airport.name }} — {{ airport.city }}</option>
        }
      </datalist>
      @if (error(); as message) {
        <span class="error" [id]="listId + '-error'">{{ message }}</span>
      }
    </label>
  `,
  styles: `
    :host {
      display: block;
      flex: 1;
      min-width: 0;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    input {
      height: 48px;
      width: 100%;
      border: 1px solid transparent;
      border-radius: var(--bb-radius);
      background: var(--bb-input);
      color: var(--bb-title);
      padding: 0 12px;
      font-size: var(--bb-fs-body);
      text-transform: uppercase;
    }

    input[aria-invalid='true'] {
      border-color: var(--bb-error);
    }

    .error {
      font-size: var(--bb-fs-body-3);
      color: var(--bb-error);
    }
  `,
})
export class AirportInput {
  readonly label = input('');
  readonly placeholder = input('JFK');
  readonly error = input<string | null>(null);
  readonly value = model('');

  protected readonly listId = `airports-${Math.random().toString(36).slice(2, 8)}`;
  private readonly airports = signal<Airport[]>([]);

  protected readonly suggestions = computed(() => {
    const query = this.value().trim().toUpperCase();
    const all = this.airports();
    if (!query) return all.slice(0, 50);
    return all
      .filter(
        (airport) =>
          airport.value.startsWith(query) ||
          airport.city.toUpperCase().includes(query) ||
          airport.name.toUpperCase().includes(query),
      )
      .slice(0, 50);
  });

  protected async loadAirports(): Promise<void> {
    if (this.airports().length) return;
    const { AIRPORTS } = await import('../../core/airports');
    this.airports.set(AIRPORTS);
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value.toUpperCase());
  }
}
