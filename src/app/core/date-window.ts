/** Ecarts proposes par le filtre de date : jour exact, ou quelques jours autour. */
export const FLEX_DAYS = [0, 1, 3, 7] as const;

const DAY_MS = 86_400_000;

/**
 * Jour calendaire d'une date ISO locale (`2026-09-20T19:30:00` ou `2026-09-20`),
 * en jours depuis l'epoch. Lu sur la chaine et non via `new Date(...)` en heure
 * locale : un passage a l'heure d'ete ferait sinon d'une difference de trois
 * jours 2,96 jours, et un vol du soir changerait de jour selon le fuseau du
 * visiteur.
 */
function calendarDay(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS;
}

/**
 * Le vol part-il a `flexDays` jours au plus de la date cherchee ? Sans date
 * cherchee, tout passe ; une date de depart illisible, rien.
 */
export function departsAround(
  departureDate: string | undefined,
  date: string | undefined,
  flexDays = 0,
): boolean {
  if (!date) return true;
  const wanted = calendarDay(date);
  const actual = departureDate ? calendarDay(departureDate) : null;
  if (wanted === null || actual === null) return false;
  return Math.abs(actual - wanted) <= flexDays;
}
