import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Vrai pour l'API gateway et ses sous-chemins seulement. Un simple
 * `startsWith(apiUrl)` laisserait passer `http://localhost:8080.evil.com` ou
 * `/api-autre` : la frontiere de chemin fait partie du test.
 */
function isApiUrl(url: string): boolean {
  const base = environment.apiUrl.replace(/\/+$/, '');
  return url === base || url.startsWith(`${base}/`);
}

/** Ajoute le bearer Keycloak sur les appels a l'API gateway. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiUrl(req.url)) return next(req);

  const auth = inject(AuthService);
  return from(auth.getValidAccessToken()).pipe(
    switchMap((token) =>
      next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req),
    ),
  );
};
