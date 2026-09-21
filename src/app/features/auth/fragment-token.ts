import { afterNextRender, inject, Injector } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Lit le jeton porte par le lien d'un email (`/reset-password#<jeton>`,
 * `/verify-email#<jeton>`), puis l'efface de la barre d'adresse.
 *
 * Le fragment n'est jamais envoye a un serveur : c'est pourquoi le jeton y vit
 * plutot que dans la requete. Trois regles tiennent dans cette fonction, et les
 * deux ecrans les recopiaient :
 *
 * - lecture **en flux** et non dans l'instantane : un second lien ouvert dans le
 *   meme onglet ne change que le fragment, et le router reutilise alors le
 *   composant au lieu d'en creer un ;
 * - le retrait passe par le router **apres le rendu** : un `replaceState` pose
 *   pendant une navigation serait reecrit par le router a la fin de celle-ci ;
 * - le fragment vide qui suit ce retrait n'est pas un lien incomplet :
 *   `missing` n'est appele que si rien n'a jamais ete lu.
 *
 * A appeler depuis un constructeur (contexte d'injection).
 */
export function readFragmentToken(onToken: (token: string) => void, onMissing: () => void): void {
  const route = inject(ActivatedRoute);
  const router = inject(Router);
  const injector = inject(Injector);
  let read = '';

  route.fragment.pipe(takeUntilDestroyed()).subscribe((fragment) => {
    const token = fragment?.trim();
    if (!token) {
      if (!read) onMissing();
      return;
    }
    read = token;
    onToken(token);
    afterNextRender(
      () => {
        void router.navigate([], { relativeTo: route, fragment: undefined, replaceUrl: true });
      },
      { injector },
    );
  });
}
