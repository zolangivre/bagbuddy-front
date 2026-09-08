import { effect, Service, signal } from '@angular/core';

export type Currency = 'EUR' | 'USD';
const STORAGE_KEY = 'userCurrency';

/**
 * Reprend CurrencyContext du mobile : les montants sont stockes en USD cote
 * backend et convertis a l'affichage. Le taux est fige, comme dans l'app
 * mobile ou l'appel a exchangerate.host est commente.
 */
@Service()
export class CurrencyService {
  private readonly usdToEur = 0.86434;

  readonly currency = signal<Currency>('EUR');
  readonly locale = signal('en-US');

  constructor() {
    try {
      const stored = localStorage?.getItem(STORAGE_KEY);
      if (stored === 'EUR' || stored === 'USD') this.currency.set(stored);
    } catch {
      // ignore
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      this.locale.set(navigator.language);
    }

    effect(() => {
      try {
        localStorage?.setItem(STORAGE_KEY, this.currency());
      } catch {
        // ignore
      }
    });
  }

  changeCurrency(currency: Currency): void {
    this.currency.set(currency);
  }

  /** Formate un montant en USD dans la devise choisie. */
  format(amountUsd: number | string | null | undefined): string {
    const amount = typeof amountUsd === 'string' ? Number.parseFloat(amountUsd) : amountUsd;
    if (amount === null || amount === undefined || Number.isNaN(amount)) return '–';

    const currency = this.currency();
    const converted = currency === 'EUR' ? amount * this.usdToEur : amount;

    return new Intl.NumberFormat(this.locale(), {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  }
}
