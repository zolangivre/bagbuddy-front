/**
 * Machine a etats des transactions.
 *
 * Le backend stocke sellerStatus / buyerStatus comme de simples colonnes texte
 * et ne valide rien : la source de verite est ici, cote front, exactement comme
 * dans l'app mobile (constants/transaction-status.js). Ajouter un statut =
 * l'ajouter ici, dans les libelles, dans le badge et dans le dispatch de la
 * page detail — et le tenir synchronise avec l'app mobile.
 */
export const TRANSACTION_STATUS = {
  // Cote acheteur
  BROWSE_LISTING: 'browse_listing',
  WAITING_FOR_RESPONSE_BUYER: 'waiting_for_response',
  REQUEST_REJECTED: 'request_rejected',
  PAYMENT_REQUIRED: 'payment_required',
  // Cote vendeur
  RESERVATION_RECEIVED: 'reservation_received',
  AWAITING_PAYMENT: 'awaiting_payment',
  WAITING_FOR_RESPONSE_SELLER: 'waiting_for_response_seller',
  // Les deux
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TransactionStatus = (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];
