import { departsAround } from './date-window';

describe('departsAround', () => {
  it('laisse tout passer sans date cherchee', () => {
    expect(departsAround('2026-09-20T19:30', undefined, 3)).toBe(true);
    expect(departsAround(undefined, undefined)).toBe(true);
  });

  it('compare en jours calendaires, heure comprise ou non', () => {
    expect(departsAround('2026-09-19T23:59', '2026-09-19')).toBe(true);
    expect(departsAround('2026-09-20T00:00', '2026-09-19')).toBe(false);
    expect(departsAround('2026-09-20', '2026-09-19', 1)).toBe(true);
  });

  it('applique la tolerance des deux cotes', () => {
    expect(departsAround('2026-09-16T10:30', '2026-09-19', 3)).toBe(true);
    expect(departsAround('2026-09-22T10:30', '2026-09-19', 3)).toBe(true);
    expect(departsAround('2026-09-23T10:30', '2026-09-19', 3)).toBe(false);
  });

  it("ne se laisse pas decaler par un changement d'heure", () => {
    // Passage a l'heure d'hiver en Europe le 25 octobre 2026 : trois jours restent trois jours.
    expect(departsAround('2026-10-27T08:00', '2026-10-24', 3)).toBe(true);
    expect(departsAround('2026-10-28T08:00', '2026-10-24', 3)).toBe(false);
  });

  it('traverse les fins de mois et d’annee', () => {
    expect(departsAround('2027-01-02T06:00', '2026-12-31', 2)).toBe(true);
  });

  it('refuse une date de depart illisible quand une date est cherchee', () => {
    expect(departsAround('bientot', '2026-09-19', 7)).toBe(false);
    expect(departsAround(undefined, '2026-09-19', 7)).toBe(false);
  });
});
