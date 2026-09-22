import { Component, computed, inject, input, linkedSignal, model, signal } from '@angular/core';
import type { Airport } from '../../core/airports';
import { I18nService } from '../../core/i18n/i18n.service';

/** Nombre d'aeroports rendus d'un coup, puis ajoutes a chaque fin de liste atteinte. */
const PAGE_SIZE = 40;
/** Distance au bas de la liste a partir de laquelle on charge la suite. */
const LOAD_MORE_MARGIN = 120;

let nextAirportInputId = 0;

/**
 * Selection d'aeroport par code IATA. La liste complete (8500+ entrees, reprise
 * telle quelle du mobile) est chargee en import dynamique au premier focus pour
 * ne pas peser sur le bundle initial.
 *
 * C'etait un `<datalist>` natif : le navigateur decidait combien d'options
 * afficher, n'ouvrait la liste qu'apres quelques lettres et coupait le reste,
 * sans prise possible sur le defilement. D'ou cette liste maison, qui s'ouvre
 * des le focus et rend les aeroports par paquets de 40, un paquet de plus
 * chaque fois qu'on approche du bas — au scroll comme aux fleches du clavier.
 *
 * Le champ vaut un code IATA, jamais une recherche : on peut taper une ville
 * pour trouver l'aeroport, mais au blur une saisie qui n'est pas un code connu
 * est effacee plutot que transmise au formulaire.
 */
@Component({
  selector: 'bb-airport-input',
  template: `
    <div class="field">
      @if (label()) {
        <label class="bb-body-2" [attr.for]="inputId">{{ label() }}</label>
      }

      <div class="control">
        <input
          [id]="inputId"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          autocomplete="off"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="listId"
          [attr.aria-activedescendant]="activeIndex() >= 0 ? optionId(activeIndex()) : null"
          [attr.aria-invalid]="!!error()"
          [attr.aria-describedby]="error() ? inputId + '-error' : null"
          [value]="value()"
          [placeholder]="placeholder()"
          (focus)="onFocus($event)"
          (input)="onInput($event)"
          (keydown)="onKeydown($event)"
          (blur)="onBlur()"
        />

        @if (open()) {
          <div class="popup">
            @if (loading()) {
              <p class="status bb-body-3">{{ i18n.t('loading') }}</p>
            } @else if (!matches().length) {
              <p class="status bb-body-3">{{ i18n.t('no_results_found') }}</p>
            }

            <ul class="list" role="listbox" [id]="listId" (scroll)="onScroll($event)">
              @for (airport of visible(); track airport.value; let i = $index) {
                <li
                  class="option"
                  role="option"
                  [id]="optionId(i)"
                  [class.active]="i === activeIndex()"
                  [attr.aria-selected]="airport.value === value()"
                  (mousedown)="pick($event, airport)"
                >
                  <span class="bb-code code">{{ airport.value }}</span>
                  <span class="text">
                    <span class="bb-body-2 city">{{ airport.city }}</span>
                    <span class="bb-body-3">{{ airport.name }}</span>
                  </span>
                </li>
              }
            </ul>
          </div>
        }
      </div>

      @if (error(); as message) {
        <span class="error" [id]="inputId + '-error'">{{ message }}</span>
      }
    </div>
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

    .control {
      position: relative;
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

    .popup {
      position: absolute;
      z-index: 20;
      top: calc(100% + 4px);
      left: 0;
      /* La liste suit la largeur du champ, sauf quand celui-ci est etroit — dans
         le rail de filtres — ou elle deborde plutot que de tronquer les villes. */
      min-width: max(100%, 260px);
      max-width: min(360px, 92vw);
      background: var(--bb-card);
      border: 1px solid var(--bb-border);
      border-radius: var(--bb-radius-sm);
      box-shadow: var(--bb-shadow-raised);
      overflow: hidden;
    }

    .status {
      margin: 0;
      padding: 12px 14px;
    }

    .list {
      list-style: none;
      margin: 0;
      padding: 4px;
      /* Hauteur bornee : c'est elle qui rend la liste defilante, donc chargeable
         par paquets. */
      max-height: 280px;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 10px;
      border-radius: var(--bb-radius-sm);
      cursor: pointer;
    }

    .option:hover,
    .option.active {
      background: var(--bb-cyan-a10);
    }

    .code {
      font-size: 1.25rem;
      color: var(--bb-primary);
      flex: none;
      width: 3ch;
    }

    .text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .city {
      color: var(--bb-title);
    }

    .text span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .error {
      font-size: var(--bb-fs-body-3);
      color: var(--bb-error);
    }
  `,
})
export class AirportInput {
  protected readonly i18n = inject(I18nService);

  readonly label = input('');
  readonly placeholder = input('JFK');
  readonly error = input<string | null>(null);
  readonly value = model('');

  private readonly id = nextAirportInputId++;
  protected readonly inputId = `bb-airport-${this.id}`;
  protected readonly listId = `bb-airport-list-${this.id}`;

  private readonly airports = signal<Airport[]>([]);
  protected readonly loading = signal(false);
  protected readonly open = signal(false);

  /** Toute nouvelle saisie repart du premier paquet et sans option active. */
  protected readonly count = linkedSignal<string, number>({
    source: () => this.value(),
    computation: () => PAGE_SIZE,
  });
  protected readonly activeIndex = linkedSignal<string, number>({
    source: () => this.value(),
    computation: () => -1,
  });

  /**
   * Sans saisie, la liste entiere — c'est tout l'interet de pouvoir la
   * parcourir. Avec, trois niveaux de pertinence : le code saisi, puis la ville
   * qui commence par la saisie, puis le reste des occurrences. Sans ce
   * classement, « PARIS » remonte Alpine Cas*paris* Municipal avant Roissy,
   * parce que la liste est ordonnee par code.
   */
  protected readonly matches = computed(() => {
    const query = this.value().trim().toUpperCase();
    const all = this.airports();
    if (!query) return all;

    const byCode: Airport[] = [];
    const byCity: Airport[] = [];
    const elsewhere: Airport[] = [];
    for (const airport of all) {
      const city = airport.city.toUpperCase();
      if (airport.value.startsWith(query)) {
        byCode.push(airport);
      } else if (city.startsWith(query)) {
        byCity.push(airport);
      } else if (city.includes(query) || airport.name.toUpperCase().includes(query)) {
        elsewhere.push(airport);
      }
    }
    return byCode.concat(byCity, elsewhere);
  });

  protected readonly visible = computed(() => this.matches().slice(0, this.count()));

  protected optionId(index: number): string {
    return `${this.listId}-option-${index}`;
  }

  /**
   * Le texte deja saisi est selectionne : revenir sur un champ rempli n'affiche
   * qu'un resultat, sa propre valeur — une frappe doit donc repartir de zero
   * sans avoir a effacer d'abord.
   */
  protected onFocus(event: FocusEvent): void {
    // Differe : au clic, le navigateur place le curseur apres le focus et
    // annulerait la selection faite ici.
    const field = event.target as HTMLInputElement;
    requestAnimationFrame(() => field.select());
    void this.openList();
  }

  private async openList(): Promise<void> {
    this.open.set(true);
    if (this.airports().length || this.loading()) return;
    this.loading.set(true);
    try {
      const { AIRPORTS } = await import('../../core/airports');
      this.airports.set(AIRPORTS);
    } finally {
      this.loading.set(false);
    }
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value.toUpperCase());
    this.open.set(true);
  }

  /** Le paquet suivant quand le bas de la liste approche. */
  protected onScroll(event: Event): void {
    const list = event.target as HTMLElement;
    if (list.scrollTop + list.clientHeight >= list.scrollHeight - LOAD_MORE_MARGIN) {
      this.loadMore();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open()) {
        void this.openList();
        return;
      }
      const items = this.visible();
      if (!items.length) return;

      const next = Math.min(
        Math.max(this.activeIndex() + (event.key === 'ArrowDown' ? 1 : -1), 0),
        items.length - 1,
      );
      this.activeIndex.set(next);
      // Au clavier aussi on doit pouvoir descendre au-dela du paquet courant.
      if (next >= items.length - 5) this.loadMore();
      this.scrollActiveIntoView(next);
      return;
    }

    if (event.key === 'Enter') {
      const airport = this.visible()[this.activeIndex()];
      if (this.open() && airport) {
        // Sans ca la touche enverrait le formulaire au lieu de choisir.
        event.preventDefault();
        this.select(airport);
      }
      return;
    }

    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.open.set(false);
    }
  }

  /** `mousedown` et non `click` : le blur de l'input fermerait la liste avant. */
  protected pick(event: MouseEvent, airport: Airport): void {
    event.preventDefault();
    this.select(airport);
  }

  /**
   * Le champ porte un code IATA. Une recherche laissee en place (« PARIS ») ne
   * doit pas partir dans le formulaire : on l'efface, l'erreur « obligatoire »
   * dit alors ce qu'il reste a faire.
   */
  protected onBlur(): void {
    this.open.set(false);
    const text = this.value().trim().toUpperCase();
    if (!text || !this.airports().length) {
      if (text !== this.value()) this.value.set(text);
      return;
    }
    this.value.set(this.airports().some((airport) => airport.value === text) ? text : '');
  }

  private select(airport: Airport): void {
    this.value.set(airport.value);
    this.open.set(false);
  }

  private loadMore(): void {
    if (this.count() < this.matches().length) {
      this.count.update((count) => count + PAGE_SIZE);
    }
  }

  private scrollActiveIntoView(index: number): void {
    requestAnimationFrame(() => {
      document.getElementById(this.optionId(index))?.scrollIntoView({ block: 'nearest' });
    });
  }
}
