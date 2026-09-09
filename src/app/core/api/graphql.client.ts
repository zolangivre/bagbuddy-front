import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Un service = un schema, donc une URL : `${apiUrl}/<service>/graphql`. */
export type GraphQlEndpoint = 'trips' | 'transactions' | 'reviews' | 'users' | 'stripe';

interface GraphQlErrorEntry {
  message: string;
  extensions?: { classification?: string; code?: string };
}

interface GraphQlResponse<T> {
  data?: T | null;
  errors?: GraphQlErrorEntry[];
}

/**
 * Ce que le statut HTTP disait avant. GraphQL repond 200 meme quand l'operation
 * echoue : `classification` porte desormais la distinction 401 / 403 / 404 /
 * 400, et `ValidationError` signale une requete qui ne respecte pas le schema —
 * un bug de code, pas une erreur utilisateur.
 */
export type GraphQlClassification =
  'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'BAD_REQUEST' | 'ValidationError' | (string & {});

/**
 * Erreur levee des que la reponse porte un `errors[]`, pour que les
 * `catchError` / callbacks `error:` des ecrans continuent de se declencher
 * comme ils le faisaient sur une reponse HTTP en echec.
 */
export class GraphQlError extends Error {
  readonly errors: GraphQlErrorEntry[];
  /** Equivalent du statut HTTP d'avant. */
  readonly classification?: GraphQlClassification;
  /** Code metier stable (ex. `email_already_used`), ex-champ du ProblemDetail. */
  readonly code?: string;

  constructor(errors: GraphQlErrorEntry[]) {
    super(errors[0]?.message ?? 'Erreur GraphQL');
    this.name = 'GraphQlError';
    this.errors = errors;
    this.classification = errors[0]?.extensions?.classification;
    this.code = errors[0]?.extensions?.code;
  }
}

/**
 * Transport unique de la couche API : un POST `{ query, variables }` par appel.
 *
 * L'intercepteur `authInterceptor` continue de poser le bearer : ces URL
 * commencent toujours par `environment.apiUrl`.
 */
@Service()
export class GraphQlClient {
  private readonly http = inject(HttpClient);

  /** Renvoie le contenu de `data`, ou leve une `GraphQlError`. */
  request<T>(
    endpoint: GraphQlEndpoint,
    query: string,
    variables: Record<string, unknown> = {},
  ): Observable<T> {
    return this.http
      .post<GraphQlResponse<T>>(`${environment.apiUrl}/${endpoint}/graphql`, { query, variables })
      .pipe(
        map((body) => {
          if (body.errors?.length) throw new GraphQlError(body.errors);
          return body.data as T;
        }),
      );
  }
}
