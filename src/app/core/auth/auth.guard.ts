import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Equivalent du garde de (tabs)/_layout.js. Le mobile renvoie a /start ; sur le
 * web on envoie a la connexion en gardant l'adresse demandee, pour y revenir
 * une fois la session ouverte — un lien partage doit mener a sa page.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isSignedIn()
    ? true
    : router.createUrlTree(['/signin'], { queryParams: { returnUrl: state.url } });
};
