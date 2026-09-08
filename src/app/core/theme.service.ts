import { effect, Service, signal } from '@angular/core';

export type ColorScheme = 'light' | 'dark';
const STORAGE_KEY = 'appTheme';

/**
 * Le mobile suit uniquement le theme systeme (ThemeContext + Appearance).
 * Sur le web on garde ce defaut, plus un choix explicite persistant pose par
 * le toggle des reglages du profil.
 */
@Service()
export class ThemeService {
  /** null = suivre le systeme. */
  readonly preference = signal<ColorScheme | null>(null);
  readonly scheme = signal<ColorScheme>('light');

  constructor() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage?.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') this.preference.set(stored);
    } catch {
      // ignore
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const systemScheme = () => (media.matches ? 'dark' : 'light');
    const sync = () => this.scheme.set(this.preference() ?? systemScheme());
    media.addEventListener('change', sync);

    effect(() => {
      const preference = this.preference();
      this.scheme.set(preference ?? systemScheme());
      const root = document.documentElement;
      if (preference) {
        root.dataset['theme'] = preference;
        try {
          localStorage?.setItem(STORAGE_KEY, preference);
        } catch {
          // ignore
        }
      } else {
        delete root.dataset['theme'];
      }
    });
  }

  toggle(): void {
    this.preference.set(this.scheme() === 'dark' ? 'light' : 'dark');
  }
}
