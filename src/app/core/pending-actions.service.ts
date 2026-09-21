import { DestroyRef, effect, inject, Service, signal, untracked } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { TransactionStatuses, TransactionsService } from './api/transactions.service';
import { AuthService } from './auth/auth.service';
import { TRANSACTION_STATUS } from './transaction-status';

/** En dessous, un changement de page ne relit pas la liste. */
const MIN_INTERVAL_MS = 15_000;

/**
 * Transaction ou c'est a l'utilisateur de jouer : le vendeur doit accepter ou
 * refuser une demande, l'acheteur doit payer une demande acceptee.
 *
 * Volontairement etroit. « Confirmee » attend la remise du colis, parfois des
 * semaines : la compter laisserait la pastille allumee sans rien a faire
 * aujourd'hui, et on apprendrait vite a l'ignorer. Meme chose pour un avis a
 * laisser ou une demande refusee a renvoyer.
 */
export function awaitsMe(transaction: TransactionStatuses, sub: string): boolean {
  if (transaction.sellerId === sub) {
    return transaction.sellerStatus === TRANSACTION_STATUS.RESERVATION_RECEIVED;
  }
  if (transaction.buyerId === sub) {
    return transaction.buyerStatus === TRANSACTION_STATUS.PAYMENT_REQUIRED;
  }
  return false;
}

/**
 * Nombre de transactions qui attendent une action de l'utilisateur connecte,
 * pour la pastille de l'onglet Transactions.
 *
 * Pas de push cote back : la liste est relue quand l'utilisateur a des chances
 * de regarder — connexion, changement de page (au plus toutes les 15 s), retour
 * sur l'onglet du navigateur — et tout de suite apres une action sur une
 * transaction (`refresh({ force: true })`). Une lecture en echec garde le
 * dernier nombre connu : une pastille qui s'eteint sur une coupure reseau
 * dirait « plus rien a faire » a tort.
 */
@Service()
export class PendingActionsService {
  private readonly auth = inject(AuthService);
  private readonly transactions = inject(TransactionsService);

  /** `null` tant que rien n'a ete lu : la pastille ne s'affiche pas. */
  readonly count = signal<number | null>(null);

  private lastRead = 0;
  private inFlight = false;

  constructor() {
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const signedIn = this.auth.isSignedIn();
      untracked(() => {
        if (signedIn) {
          this.refresh({ force: true });
        } else {
          this.count.set(null);
          this.lastRead = 0;
        }
      });
    });

    const navigation = router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.refresh());
    destroyRef.onDestroy(() => navigation.unsubscribe());

    if (typeof document !== 'undefined') {
      const onVisible = () => {
        if (document.visibilityState === 'visible') this.refresh();
      };
      document.addEventListener('visibilitychange', onVisible);
      destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
    }
  }

  refresh(options: { force?: boolean } = {}): void {
    const sub = this.auth.userInfo()?.sub;
    if (!this.auth.isSignedIn() || !sub || this.inFlight) return;
    if (!options.force && Date.now() - this.lastRead < MIN_INTERVAL_MS) return;

    this.inFlight = true;
    this.lastRead = Date.now();
    this.transactions.mineStatuses().subscribe({
      next: (list) => {
        this.inFlight = false;
        this.count.set(list.filter((transaction) => awaitsMe(transaction, sub)).length);
      },
      error: () => {
        this.inFlight = false;
      },
    });
  }
}
