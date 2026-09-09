import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GraphQlClient } from './graphql.client';

/** Schema GraphQL de stripeservice, servi sur /stripe/graphql. */
@Service()
export class StripeService {
  private readonly gql = inject(GraphQlClient);

  config(): Observable<{ publishableKey: string }> {
    return this.gql
      .request<{
        stripeConfig: { publishableKey: string };
      }>('stripe', `query { stripeConfig { publishableKey } }`)
      .pipe(map((data) => data.stripeConfig));
  }

  /**
   * Le montant n'est PAS envoye par le client : le back lit la transaction,
   * verifie qu'on en est bien l'acheteur et calcule la somme a partir de
   * l'annonce. On ne transmet donc que l'identifiant de la transaction.
   *
   * Le passage effectif en "paye" ne vient pas de cette reponse mais du webhook
   * Stripe signe, qui reste en REST cote back (le front ne l'appelle pas).
   */
  createPaymentIntent(transactionId: string): Observable<{ clientSecret: string }> {
    return this.gql
      .request<{ createPaymentIntent: { clientSecret: string } }>(
        'stripe',
        `mutation($transactionId: ID!) { createPaymentIntent(transactionId: $transactionId) { clientSecret } }`,
        { transactionId },
      )
      .pipe(map((data) => data.createPaymentIntent));
  }
}
