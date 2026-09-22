/** Portage de components/LocalizedDateTime.js. */

const dateTimeFormats = new Map<string, Intl.DateTimeFormat>();

/**
 * Construire un `Intl.DateTimeFormat` charge les donnees de locale : c'est la
 * partie couteuse, `format()` ne l'est pas. Chaque carte formate quatre dates a
 * chaque rendu, donc un formateur par combinaison langue / options, reutilise.
 */
function dateTimeFormat(language: string, options: Intl.DateTimeFormatOptions) {
  const key = `${language}|${JSON.stringify(options)}`;
  let format = dateTimeFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(language, options);
    dateTimeFormats.set(key, format);
  }
  return format;
}

export function formatLocalizedDate(
  date: string | Date | null | undefined,
  language = 'en',
  style: 'short' | 'long' = 'short',
): string {
  if (!date) return '';
  const dt = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(dt.getTime())) return '';
  return dateTimeFormat(language, {
    month: style === 'short' ? 'short' : 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(dt);
}

export function formatLocalizedTime(
  date: string | Date | null | undefined,
  language = 'en',
  includeSeconds = false,
): string {
  if (!date) return '';
  const dt = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(dt.getTime())) return '';
  return dateTimeFormat(language, {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' as const } : {}),
    hour12: language === 'en',
  }).format(dt);
}

export function formatLocalizedDateTime(
  date: string | Date | null | undefined,
  language = 'en',
): string {
  if (!date) return '';
  return `${formatLocalizedDate(date, language)} • ${formatLocalizedTime(date, language)}`;
}

/** Initiales d'un nom complet, comme les avatars du mobile. */
export function initialsOf(name: string | null | undefined, fallback = '??'): string {
  if (!name) return fallback;
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || fallback
  );
}

/** Valeur d'un input datetime-local (`YYYY-MM-DDTHH:mm`) depuis une date ISO. */
export function toDateTimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
