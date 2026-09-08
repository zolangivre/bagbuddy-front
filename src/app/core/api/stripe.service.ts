import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Route /stripe/** de l'API gateway -> stripeservice. */
@Service()
export class StripeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/stripe`;

  config(): Observable<{ publishableKey: string }> {
    return this.http.get<{ publishableKey: string }>(`${this.base}/config`);
  }

  /**
   * Le montant n'est PAS envoye par le client : le back lit la transaction,
   * verifie qu'on en est bien l'acheteur et calcule la somme a partir de
   * l'annonce. On ne transmet donc que l'identifiant de la transaction.
   *
   * Le passage effectif en "paye" ne vient pas de cette reponse mais du webhook
   * Stripe signe, cote back.
   */
  createPaymentIntent(transactionId: string): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(`${this.base}/create-payment-intent`, {
      transactionId,
    });
  }
}
