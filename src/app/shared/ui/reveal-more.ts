import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  Signal,
} from '@angular/core';

/**
 * Sentinelle posee apres une liste rendue par tranches : emet `reached` quand
 * elle approche de la fenetre, et le parent affiche la tranche suivante.
 *
 * Pourquoi pas une vraie pagination : l'accueil et les transactions filtrent et
 * trient cote client sur la liste complete (et calculent leurs totaux dessus),
 * et le schema n'offre ni filtre ni tri serveur — `myTransactions` n'a meme pas
 * de `limit`. Couper la requete fausserait les filtres. On garde donc une seule
 * lecture et on etale le rendu : c'est le DOM de cinquante cartes d'embarquement
 * qui coute, pas le JSON.
 *
 * `count` est le nombre d'elements deja affiches. A chaque changement la
 * sentinelle est re-observee : un IntersectionObserver ne rappelle que sur un
 * changement d'etat, et une tranche trop courte pour la repousser hors de la
 * marge la laisserait « deja visible » sans nouvel appel.
 */
@Component({
  selector: 'bb-reveal-more',
  template: '',
  host: { 'aria-hidden': 'true' },
  styles: `
    :host {
      display: block;
      height: 1px;
    }
  `,
})
export class RevealMore {
  readonly count = input.required<number>();
  readonly reached = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private observer?: IntersectionObserver;

  constructor() {
    // Apres rendu et navigateur seulement : c'est la que l'observer a un sens.
    afterRenderEffect(() => {
      this.count();
      this.observer ??= new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) this.reached.emit();
        },
        // Une bonne hauteur d'ecran d'avance : la tranche suivante est la avant
        // que le defilement n'atteigne le bas.
        { rootMargin: '0px 0px 1200px 0px' },
      );
      this.observer.unobserve(this.host);
      this.observer.observe(this.host);
    });

    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }
}

/**
 * Etat d'une liste rendue par tranches de `size`, a poser a cote de
 * `<bb-reveal-more>`. Le compte repart d'une tranche des que `source` change
 * (filtre, tri, onglet, rechargement) : on veut voir le haut de la nouvelle
 * liste, pas garder cent cartes montees.
 */
export function revealInSlices<T>(source: Signal<readonly T[]>, size: number) {
  const count = linkedSignal({ source, computation: () => size });
  return {
    count: count.asReadonly(),
    shown: computed(() => source().slice(0, count())),
    hasMore: computed(() => count() < source().length),
    more: () => count.update((current) => current + size),
  };
}
