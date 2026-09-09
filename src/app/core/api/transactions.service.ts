import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Transaction } from '../models';
import { GraphQlClient } from './graphql.client';

const PARTY_FIELDS = `sub name givenName familyName username emailVerified bio location email phone`;

const TRANSACTION_FIELDS = `
  id listingId buyerId sellerId sellerStatus buyerStatus weight total
  sellerReview buyerReview stripePaymentIntentId stripeCurrency stripeAmount
  paidAt createdAt
  buyerInfo { ${PARTY_FIELDS} }
  listingInfo {
    departureAirport arrivalAirport departureDate arrivalDate
    totalWeightAvailable remainingWeight pricePerKg conditions createdAt
    sellerUserInfo { ${PARTY_FIELDS} }
  }
`;

/**
 * Schema GraphQL de transactionservice, servi sur /transactions/graphql.
 *
 * Les ecrans passent encore la transaction entiere en payload de `update()` :
 * le schema, lui, n'accepte que les statuts, le poids et les drapeaux d'avis.
 * C'est ici qu'on filtre — l'argent, le paiement et les identifiants des parties
 * ne sont jamais ecrits par le client, et les envoyer leverait une
 * ValidationError.
 */
@Service()
export class TransactionsService {
  private readonly gql = inject(GraphQlClient);

  /**
   * `myTransactions` se cadre sur le jeton et ne prend pas d'argument : le `sub`
   * reste dans la signature pour les appelants, mais n'est plus transmis.
   * `transactionsByUser` existe encore cote schema, et refuse tout autre `sub`
   * que celui de l'appelant — autant ne pas s'exposer a un FORBIDDEN.
   */
  byUser(_sub: string): Observable<Transaction[]> {
    return this.gql
      .request<{
        myTransactions: Transaction[];
      }>('transactions', `query { myTransactions { ${TRANSACTION_FIELDS} } }`)
      .pipe(map((data) => data.myTransactions));
  }

  byId(id: string): Observable<Transaction> {
    return this.gql
      .request<{ transaction: Transaction }>(
        'transactions',
        `query($id: ID!) { transaction(id: $id) { ${TRANSACTION_FIELDS} } }`,
        { id },
      )
      .pipe(map((data) => data.transaction));
  }

  countForUser(sub: string): Observable<number> {
    return this.gql
      .request<{ transactionCount: number }>(
        'transactions',
        `query($userId: String!) { transactionCount(userId: $userId) }`,
        { userId: sub },
      )
      .pipe(map((data) => data.transactionCount));
  }

  totalSpent(sub: string): Observable<number> {
    return this.gql
      .request<{ totalSpent: number }>(
        'transactions',
        `query($buyerId: String!) { totalSpent(buyerId: $buyerId) }`,
        { buyerId: sub },
      )
      .pipe(map((data) => data.totalSpent));
  }

  totalEarned(sub: string): Observable<number> {
    return this.gql
      .request<{ totalEarned: number }>(
        'transactions',
        `query($sellerId: String!) { totalEarned(sellerId: $sellerId) }`,
        { sellerId: sub },
      )
      .pipe(map((data) => data.totalEarned));
  }

  /** Seuls l'annonce et le poids partent : le total est tarife par le serveur. */
  create(payload: Partial<Transaction>): Observable<Transaction> {
    return this.gql
      .request<{ createTransaction: Transaction }>(
        'transactions',
        `mutation($input: CreateTransactionInput!) { createTransaction(input: $input) { ${TRANSACTION_FIELDS} } }`,
        { input: { listingId: payload.listingId, weight: payload.weight } },
      )
      .pipe(map((data) => data.createTransaction));
  }

  update(id: string, payload: Partial<Transaction>): Observable<Transaction> {
    return this.gql
      .request<{ updateTransaction: Transaction }>(
        'transactions',
        `mutation($id: ID!, $input: UpdateTransactionInput!) { updateTransaction(id: $id, input: $input) { ${TRANSACTION_FIELDS} } }`,
        {
          id,
          input: {
            sellerStatus: payload.sellerStatus,
            buyerStatus: payload.buyerStatus,
            weight: payload.weight,
            sellerReview: payload.sellerReview,
            buyerReview: payload.buyerReview,
          },
        },
      )
      .pipe(map((data) => data.updateTransaction));
  }
}
