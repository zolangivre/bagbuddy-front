import { TransactionStatuses } from './api/transactions.service';
import { awaitsMe } from './pending-actions.service';
import { TRANSACTION_STATUS } from './transaction-status';

const ME = 'me';
const OTHER = 'other';

function deal(
  role: 'seller' | 'buyer',
  sellerStatus: string,
  buyerStatus: string,
): TransactionStatuses {
  return {
    id: '1',
    sellerId: role === 'seller' ? ME : OTHER,
    buyerId: role === 'buyer' ? ME : OTHER,
    sellerStatus,
    buyerStatus,
  };
}

describe('awaitsMe', () => {
  const S = TRANSACTION_STATUS;

  it('compte une demande recue pour le vendeur, pas pour l’acheteur qui attend', () => {
    expect(awaitsMe(deal('seller', S.RESERVATION_RECEIVED, S.WAITING_FOR_RESPONSE_BUYER), ME)).toBe(
      true,
    );
    expect(awaitsMe(deal('buyer', S.RESERVATION_RECEIVED, S.WAITING_FOR_RESPONSE_BUYER), ME)).toBe(
      false,
    );
  });

  it('compte un paiement a faire pour l’acheteur, pas pour le vendeur qui attend', () => {
    expect(awaitsMe(deal('buyer', S.AWAITING_PAYMENT, S.PAYMENT_REQUIRED), ME)).toBe(true);
    expect(awaitsMe(deal('seller', S.AWAITING_PAYMENT, S.PAYMENT_REQUIRED), ME)).toBe(false);
  });

  it('ne compte ni une transaction confirmee, ni une terminee, ni une annulee', () => {
    for (const status of [S.CONFIRMED, S.COMPLETED, S.CANCELLED]) {
      expect(awaitsMe(deal('buyer', status, status), ME)).toBe(false);
      expect(awaitsMe(deal('seller', status, status), ME)).toBe(false);
    }
  });

  it('ignore une transaction dont on n’est pas partie', () => {
    const foreign: TransactionStatuses = {
      id: '2',
      sellerId: OTHER,
      buyerId: 'third',
      sellerStatus: S.RESERVATION_RECEIVED,
      buyerStatus: S.WAITING_FOR_RESPONSE_BUYER,
    };
    expect(awaitsMe(foreign, ME)).toBe(false);
  });
});
