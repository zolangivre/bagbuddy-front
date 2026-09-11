import { HttpErrorResponse } from '@angular/common/http';
import { GraphQlError } from './graphql.client';

/** Les trois messages qu'un ecran peut afficher quand une lecture echoue. */
export type LoadErrorKey = 'load_error' | 'load_error_offline' | 'load_error_unavailable';

/**
 * Traduit l'erreur d'un chargement en message, pour qu'un ecran en echec ne se
 * confonde plus avec un ecran vide.
 *
 * - statut HTTP 0 (ou navigateur hors ligne) : la gateway n'a pas ete jointe ;
 * - 502 / 503 / 504, ou le code `service_unavailable` qu'un service pose quand
 *   c'est un autre service, derriere lui, qui ne repond pas : reessayer a un
 *   sens ;
 * - le reste (NOT_FOUND, FORBIDDEN, erreur interne...) : message generique. Un
 *   ecran qui veut distinguer l'introuvable lit `classification` lui-meme.
 */
export function loadErrorKey(error: unknown): LoadErrorKey {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'load_error_offline';
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'load_error_offline';
    if (error.status >= 502 && error.status <= 504) return 'load_error_unavailable';
  }
  if (error instanceof GraphQlError && error.code === 'service_unavailable') {
    return 'load_error_unavailable';
  }
  return 'load_error';
}
