import { inject, Service } from '@angular/core';
import { catchError, map, Observable, shareReplay, throwError } from 'rxjs';
import { GraphQlClient } from './graphql.client';

export interface PayoutAccountStatus {
  /** Un compte Connect existe. */
  connected: boolean;
  /** Le formulaire Stripe est rempli. */
  detailsSubmitted: boolean;
  /** Stripe verse vers la banque du membre. */
  payoutsEnabled: boolean;
  /** La plateforme peut lui transferer des fonds : debloque les versements en attente. */
  transfersActive: boolean;
}

/** Schema GraphQL de stripeservice, servi sur /stripe/graphql. */
@Service()
export class StripeService {
  private readonly gql = inject(GraphQlClient);

  /**
   * La cle publiable ne change pas d'un appel a l'autre : on garde la reponse
   * pour la session. Cette lecture sert aussi de test de presence (stripeservice
   * est eteint en dev), et ce test revient a chaque clic sur « payer ».
   */
  private cached?: Observable<{ publishableKey: string }>;

  config(): Observable<{ publishableKey: string }> {
    this.cached ??= this.gql
      .request<{
        stripeConfig: { publishableKey: string };
      }>('stripe', `query { stripeConfig { publishableKey } }`)
      .pipe(
        map((data) => data.stripeConfig),
        // Un echec n'est pas garde : le service peut revenir avant la fin de la session.
        catchError((error: unknown) => {
          this.cached = undefined;
          return throwError(() => error);
        }),
        // refCount: false — la reponse survit au desabonnement du premier appelant.
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.cached;
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

  /** Ou en est le compte de versement (Stripe Connect) de l'appelant. */
  payoutAccount(): Observable<PayoutAccountStatus> {
    return this.gql
      .request<{ payoutAccount: PayoutAccountStatus }>(
        'stripe',
        `query { payoutAccount { connected detailsSubmitted payoutsEnabled transfersActive } }`,
      )
      .pipe(map((data) => data.payoutAccount));
  }

  /**
   * Lien d'onboarding Stripe Connect, a usage unique et de courte duree : a
   * ouvrir aussitot (redirection), jamais a stocker. Stripe renvoie ensuite sur
   * `/account?payouts=done`, ou `?payouts=retry` si le lien a expire.
   */
  startPayoutOnboarding(): Observable<string> {
    return this.gql
      .request<{ startPayoutOnboarding: { url: string } }>(
        'stripe',
        `mutation { startPayoutOnboarding { url } }`,
      )
      .pipe(map((data) => data.startPayoutOnboarding.url));
  }
}
