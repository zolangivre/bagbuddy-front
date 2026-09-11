import { computed, effect, Service, signal } from '@angular/core';
import { en } from './en';
import { fr } from './fr';

export type Language = 'en' | 'fr';
export type TranslationKey = keyof typeof en;

const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = { en, fr };
const LANGUAGES = Object.keys(DICTIONARIES) as Language[];
const STORAGE_KEY = 'appLanguage';

/**
 * Equivalent web de i18n-js + LanguageContext du mobile : la langue est un
 * signal, donc `t()` appele depuis un template se reevalue tout seul quand la
 * langue change. Persistee dans localStorage comme AsyncStorage cote mobile.
 */
@Service()
export class I18nService {
  readonly language = signal<Language>('en');
  readonly dictionary = computed(() => DICTIONARIES[this.language()]);
  /** Toutes les langues connues : `bb-t` s'en sert pour reserver la place. */
  readonly languages: readonly Language[] = LANGUAGES;

  constructor() {
    this.language.set(this.detectInitialLanguage());
    effect(() => {
      const lang = this.language();
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
      try {
        localStorage?.setItem(STORAGE_KEY, lang);
      } catch {
        // Navigation privee / stockage bloque : la langue reste en memoire.
      }
    });
  }

  /** `t('welcome_back', { name })` — interpolation `{{name}}` comme i18n-js. */
  t(key: TranslationKey, params?: Record<string, string | number>): string {
    return this.translateIn(this.language(), key, params);
  }

  /**
   * Meme traduction, dans une langue imposee. Sert a `bb-t`, qui rend toutes
   * les langues pour figer la largeur du libelle : sans ca, changer de langue
   * redimensionne le bouton ou l'onglet qui le porte.
   */
  translateIn(
    language: Language,
    key: TranslationKey,
    params?: Record<string, string | number>,
  ): string {
    const template = DICTIONARIES[language][key] ?? en[key] ?? String(key);
    if (!params) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
      params[name] === undefined ? match : String(params[name]),
    );
  }

  changeLanguage(language: Language): void {
    this.language.set(language);
  }

  private detectInitialLanguage(): Language {
    try {
      const stored = localStorage?.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'fr') return stored;
    } catch {
      // ignore
    }
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('fr')) return 'fr';
    return 'en';
  }
}
