import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Transaction, TransactionMessage } from '../models';
import { GraphQlClient } from './graphql.client';

const PARTY_FIELDS = `sub name givenName familyName username emailVerified bio location email phone`;

const TRANSACTION_FIELDS = `
  id listingId buyerId sellerId sellerStatus buyerStatus weight total
  sellerReview buyerReview stripePaymentIntentId stripeCurrency stripeAmount
  paidAt createdAt contentDescription prohibitedItemsAccepted handoverCode handoverLocked
  platformFee refundAmount refundStatus refundedAt payoutAmount payoutStatus paidOutAt
  buyerInfo { ${PARTY_FIELDS} }
  listingInfo {
    departureAirport arrivalAirport departureDate arrivalDate
    totalWeightAvailable remainingWeight pricePerKg conditions createdAt
    sellerUserInfo { ${PARTY_FIELDS} }
  }
`;

export type TransactionStatuses = Pick<
  Transaction,
  'id' | 'buyerId' | 'sellerId' | 'buyerStatus' | 'sellerStatus'
>;

export interface TransactionStats {
  count: number;
  earned: number;
  spent: number;
}

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
   * Achats et ventes de l'appelant, les plus recents d'abord. `myTransactions` se
   * cadre sur le jeton et ne prend pas d'argument : l'ancienne variante qui
   * prenait un `userId` (force a celui du jeton) a ete retiree du schema.
   */
  mine(): Observable<Transaction[]> {
    return this.gql
      .request<{
        myTransactions: Transaction[];
      }>('transactions', `query { myTransactions { ${TRANSACTION_FIELDS} } }`)
      .pipe(map((data) => data.myTransactions));
  }

  /**
   * Meme liste que `mine()`, reduite aux statuts : c'est tout ce dont la
   * pastille de navigation a besoin, et elle se relit a chaque changement de
   * page. Les instantanes d'annonce et de parties n'y seraient que du poids.
   */
  mineStatuses(): Observable<TransactionStatuses[]> {
    return this.gql
      .request<{
        myTransactions: TransactionStatuses[];
      }>(
        'transactions',
        `query { myTransactions { id buyerId sellerId buyerStatus sellerStatus } }`,
      )
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

  /**
   * Un seul champ : l'attente du webhook relit ce point toutes les deux secondes,
   * elle n'a pas besoin des parties, de l'annonce ni du reglement.
   */
  paidAt(id: string): Observable<string | null> {
    return this.gql
      .request<{ transaction: { paidAt: string | null } }>(
        'transactions',
        `query($id: ID!) { transaction(id: $id) { paidAt } }`,
        { id },
      )
      .pipe(map((data) => data.transaction.paidAt));
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

  /**
   * Les trois chiffres du profil en un seul aller-retour. `countForUser`,
   * `totalEarned` et `totalSpent` restent pour qui n'en veut qu'un, mais trois
   * appels sur le meme schema, c'etaient trois POST et trois verifications de
   * jeton pour une seule question.
   */
  statsForUser(sub: string): Observable<TransactionStats> {
    return this.gql
      .request<{ transactionCount: number; totalEarned: number; totalSpent: number }>(
        'transactions',
        `query($sub: String!) {
          transactionCount(userId: $sub)
          totalEarned(sellerId: $sub)
          totalSpent(buyerId: $sub)
        }`,
        { sub },
      )
      .pipe(
        map((data) => ({
          count: data.transactionCount,
          earned: data.totalEarned,
          spent: data.totalSpent,
        })),
      );
  }

  /**
   * L'annonce, le poids et la declaration du contenu : le total est tarife par
   * le serveur. Sans description ni engagement sur les objets interdits, le
   * serveur refuse (`content_description_required`,
   * `prohibited_items_not_accepted`).
   */
  create(payload: Partial<Transaction>): Observable<Transaction> {
    return this.gql
      .request<{ createTransaction: Transaction }>(
        'transactions',
        `mutation($input: CreateTransactionInput!) { createTransaction(input: $input) { ${TRANSACTION_FIELDS} } }`,
        {
          input: {
            listingId: payload.listingId,
            weight: payload.weight,
            contentDescription: payload.contentDescription,
            prohibitedItemsAccepted: payload.prohibitedItemsAccepted ?? false,
          },
        },
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

  /**
   * Le voyageur clot la transaction payee avec le code que le destinataire lui
   * donne. Codes : `invalid_handover_code`, `handover_locked` (5 essais),
   * `handover_not_expected`.
   */
  confirmHandover(id: string, code: string): Observable<Transaction> {
    return this.gql
      .request<{ confirmHandover: Transaction }>(
        'transactions',
        `mutation($id: ID!, $code: String!) { confirmHandover(id: $id, code: $code) { ${TRANSACTION_FIELDS} } }`,
        { id, code },
      )
      .pipe(map((data) => data.confirmHandover));
  }

  /** Fil de la transaction, ou sa suite apres `afterId`. Participants seulement. */
  messages(transactionId: string, afterId?: string): Observable<TransactionMessage[]> {
    return this.gql
      .request<{ transactionMessages: TransactionMessage[] }>(
        'transactions',
        `query($transactionId: ID!, $afterId: ID) {
          transactionMessages(transactionId: $transactionId, afterId: $afterId) { id senderSub body createdAt mine }
        }`,
        { transactionId, afterId },
      )
      .pipe(map((data) => data.transactionMessages));
  }

  /** Codes : `invalid_message`, `conversation_closed`, `too_many_messages`. */
  sendMessage(transactionId: string, body: string): Observable<TransactionMessage> {
    return this.gql
      .request<{ sendTransactionMessage: TransactionMessage }>(
        'transactions',
        `mutation($transactionId: ID!, $body: String!) {
          sendTransactionMessage(transactionId: $transactionId, body: $body) { id senderSub body createdAt mine }
        }`,
        { transactionId, body },
      )
      .pipe(map((data) => data.sendTransactionMessage));
  }
}
