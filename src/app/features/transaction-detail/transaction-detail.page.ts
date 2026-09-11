import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GraphQlError } from '../../core/api/graphql.client';
import { LoadErrorKey, loadErrorKey } from '../../core/api/load-error';
import { ReviewsService } from '../../core/api/reviews.service';
import { TransactionsService } from '../../core/api/transactions.service';
import { TripsService } from '../../core/api/trips.service';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { formatLocalizedDate } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Listing, ListingInfo, Review, Role, Transaction } from '../../core/models';
import { TRANSACTION_STATUS } from '../../core/transaction-status';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { IconButton } from '../../shared/ui/icon-button';
import { LoadError } from '../../shared/ui/load-error';
import { Loader } from '../../shared/ui/loader';
import { ReviewCard } from '../../shared/ui/review-card';
import { StatusBadge } from '../../shared/ui/status-badge';
import { PartyCard } from './party-card';
import { ProgressCard } from './progress-card';
import { StatusCard } from './status-card';
import { ReviewDraft, ReviewModal } from './review-modal';
import { WeightSelector } from './weight-selector';

/**
 * Portage de app/transaction-detail.js + TransactionDetailComponents/Content.js.
 * Un seul aiguillage sur le statut, comme cote mobile : ajouter un statut
 * implique d'ajouter un cas ici, dans le badge et dans la carte de statut.
 */
@Component({
  selector: 'bb-transaction-detail-page',
  imports: [
    RouterLink,
    IconButton,
    StatusBadge,
    ProgressCard,
    PartyCard,
    StatusCard,
    WeightSelector,
    ReviewCard,
    ReviewModal,
    Button,
    Loader,
    LoadError,
    Icon,
  ],
  template: `
    <header class="topbar">
      <div class="inner">
        <bb-icon-button
          icon="arrow-left"
          [label]="i18n.t('back')"
          data-variant="ghost"
          (pressed)="goBack()"
        />
        <div class="titles">
          <h1 class="bb-section-title">
            {{ listing()?.departureAirport }} → {{ listing()?.arrivalAirport }}
          </h1>
          <span class="bb-body-3">{{ createdOn() }}</span>
        </div>
        <bb-status-badge [status]="status()" />
      </div>
    </header>

    @if (loading()) {
      <bb-loader [label]="i18n.t('loading')" />
    } @else if (loadError(); as error) {
      <div class="bb-page">
        <bb-load-error [messageKey]="error" (retry)="load()" />
      </div>
    } @else if (listing(); as currentListing) {
      <div class="bb-page content bb-with-rail bb-with-rail--aside">
        <section class="main">
          <bb-status-card [status]="status()" [role]="role()" [transaction]="transaction()" />

          <bb-party-card [listing]="currentListing" [transaction]="transaction()" />

          <!--
            Contenu propre a l'etape : ce qui demande une saisie ou de la
            lecture reste dans la colonne principale, les actions vont dans la
            colonne collante a droite.
          -->
          @switch (status()) {
            @case (statuses.BROWSE_LISTING) {
              @if (role() === 'buyer') {
                <bb-weight-selector [listing]="currentListing" [(weight)]="selectedWeight" />
              }
            }

            @case (statuses.REQUEST_REJECTED) {
              <div class="retry">
                <h2 class="bb-title-md">{{ i18n.t('try_a_different_amount') }}</h2>
                <p class="bb-body">
                  {{ i18n.t('try_a_different_amount_description', { seller: sellerName() }) }}
                </p>
              </div>
              <bb-weight-selector [listing]="currentListing" [(weight)]="selectedWeight" />
            }

            @case (statuses.COMPLETED) {
              @for (review of reviews(); track review.id) {
                <div class="bb-card">
                  <bb-review-card
                    [review]="review"
                    [editable]="review.reviewerId === currentUserSub()"
                    (edit)="editReview($event)"
                  />
                </div>
              }
            }
          }
        </section>

        <aside class="side bb-rail-sticky">
          @if (progressStep() !== null) {
            <bb-progress-card [step]="progressStep()!" [role]="role()" />
          }

          <!-- Actions de l'etape : toujours visibles, sans avoir a redescendre. -->
          @switch (status()) {
            @case (statuses.BROWSE_LISTING) {
              @if (role() === 'buyer') {
                <bb-button
                  [text]="i18n.t('send_reservation_request')"
                  [disabled]="submitting()"
                  (pressed)="sendReservationRequest()"
                >
                  <bb-icon slot="right" name="send" [size]="20" />
                </bb-button>
              }
            }

            @case (statuses.REQUEST_REJECTED) {
              <bb-button
                [text]="i18n.t('send_new_request')"
                [disabled]="submitting()"
                (pressed)="sendNewRequest()"
              >
                <bb-icon slot="right" name="send" [size]="20" />
              </bb-button>
            }

            @case (statuses.RESERVATION_RECEIVED) {
              <bb-button
                [text]="i18n.t('accept_request')"
                [disabled]="submitting()"
                (pressed)="acceptRequest()"
              >
                <bb-icon slot="left" name="circle-check" [size]="20" />
              </bb-button>
              <bb-button
                [text]="i18n.t('decline_request')"
                tone="error"
                [disabled]="submitting()"
                (pressed)="declineRequest()"
              >
                <bb-icon slot="left" name="circle-x" [size]="20" />
              </bb-button>
            }

            @case (statuses.PAYMENT_REQUIRED) {
              <bb-button
                [text]="i18n.t('complete_payment')"
                [disabled]="submitting()"
                (pressed)="completePayment()"
              >
                <bb-icon slot="left" name="credit-card" [size]="20" />
              </bb-button>
              <bb-button
                [text]="i18n.t('cancel_transaction')"
                tone="error"
                [disabled]="submitting()"
                (pressed)="cancelTransaction()"
              >
                <bb-icon slot="right" name="x" [size]="20" />
              </bb-button>
            }

            @case (statuses.AWAITING_PAYMENT) {
              <bb-button
                [text]="i18n.t('cancel_transaction')"
                tone="error"
                [disabled]="submitting()"
                (pressed)="cancelTransaction()"
              >
                <bb-icon slot="right" name="x" [size]="20" />
              </bb-button>
            }

            @case (statuses.CONFIRMED) {
              @if (role() === 'buyer') {
                <bb-button
                  [text]="i18n.t('mark_as_completed')"
                  tone="success"
                  [disabled]="submitting()"
                  (pressed)="markAsCompleted()"
                />
              }
            }

            @case (statuses.COMPLETED) {
              @if (canReview()) {
                <bb-button
                  [text]="i18n.t('put_in_review')"
                  tone="warning"
                  (pressed)="openReviewModal()"
                >
                  <bb-icon slot="left" name="star" [size]="20" />
                </bb-button>
              }
            }
          }
        </aside>
      </div>

      <bb-review-modal
        [(open)]="reviewModalOpen"
        [review]="editedReview()"
        (submitted)="submitReview($event)"
      />
    } @else {
      <div class="bb-page">
        <p class="bb-empty">{{ i18n.t('no_results_found') }}</p>
        <a class="bb-highlight" routerLink="/home">{{ i18n.t('home') }}</a>
      </div>
    }
  `,
  styles: `
    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bb-card);
      border-bottom: 1px solid var(--bb-border);
    }

    .inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .titles {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .titles h1 {
      margin: 0;
    }

    .content {
      padding-top: 24px;
      padding-bottom: 48px;
    }

    .main,
    .side {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .retry {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .retry h2,
    .retry p {
      margin: 0;
    }

    @media (min-width: 1024px) {
      .bb-with-rail--aside {
        grid-template-columns: minmax(0, 1fr) 340px;
      }
    }
  `,
})
export class TransactionDetailPage {
  protected readonly i18n = inject(I18nService);
  protected readonly statuses = TRANSACTION_STATUS;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly trips = inject(TripsService);
  private readonly transactionsApi = inject(TransactionsService);
  private readonly reviewsApi = inject(ReviewsService);
  private readonly confirm = inject(ConfirmService);

  protected readonly loading = signal(true);
  /** Echec de lecture autre qu'un introuvable, qui garde son propre ecran. */
  protected readonly loadError = signal<LoadErrorKey | null>(null);
  protected readonly submitting = signal(false);
  protected readonly listing = signal<ListingInfo | null>(null);
  protected readonly transaction = signal<Transaction | null>(null);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly role = signal<Role>('buyer');
  protected readonly status = signal<string>(TRANSACTION_STATUS.BROWSE_LISTING);
  protected readonly selectedWeight = signal(1);
  protected readonly reviewModalOpen = signal(false);
  protected readonly editedReview = signal<Review | null>(null);

  protected readonly currentUserSub = computed(() => this.auth.userInfo()?.sub ?? '');
  protected readonly sellerName = computed(
    () => this.transaction()?.listingInfo?.sellerUserInfo?.name ?? '',
  );
  protected readonly createdOn = computed(() =>
    formatLocalizedDate(this.listing()?.createdAt, this.i18n.language()),
  );

  /** Etape a mettre en avant selon le statut (voir Content.js du mobile). */
  protected readonly progressStep = computed<number | null>(() => {
    const role = this.role();
    switch (this.status()) {
      case TRANSACTION_STATUS.BROWSE_LISTING:
        return role === 'buyer' ? 0 : null;
      case TRANSACTION_STATUS.RESERVATION_RECEIVED:
      // Apres un refus, la suite pour le vendeur est une nouvelle demande de
      // l'acheteur : il revient a « demande recue », pas a « attente du
      // paiement », qui laisserait croire la demande acceptee.
      case TRANSACTION_STATUS.WAITING_FOR_RESPONSE_SELLER:
        return 0;
      case TRANSACTION_STATUS.WAITING_FOR_RESPONSE_BUYER:
      case TRANSACTION_STATUS.REQUEST_REJECTED:
      case TRANSACTION_STATUS.AWAITING_PAYMENT:
        return 1;
      case TRANSACTION_STATUS.PAYMENT_REQUIRED:
        return 2;
      case TRANSACTION_STATUS.CONFIRMED:
        return role === 'buyer' ? 3 : 2;
      case TRANSACTION_STATUS.COMPLETED:
        return role === 'buyer' ? 4 : 3;
      default:
        return null;
    }
  });

  protected readonly canReview = computed(() => {
    const transaction = this.transaction();
    if (!transaction) return false;
    return this.role() === 'buyer' ? !transaction.buyerReview : !transaction.sellerReview;
  });

  constructor() {
    this.load();
  }

  /** Relit l'URL a chaque appel : apres une reservation, elle porte la transaction. */
  protected load(): void {
    const params = this.route.snapshot.queryParamMap;
    const transactionId = params.get('transactionId');
    const listingId = params.get('listingId');

    this.loadError.set(null);
    if (transactionId) {
      this.loadTransaction(transactionId);
    } else if (listingId) {
      this.loadListing(listingId);
    } else {
      this.loading.set(false);
    }
  }

  private loadListing(listingId: string): void {
    this.loading.set(true);
    this.trips.byId(listingId).subscribe({
      next: (listing) => {
        this.listing.set(listing);
        this.role.set(listing.userId === this.currentUserSub() ? 'seller' : 'buyer');
        this.status.set(TRANSACTION_STATUS.BROWSE_LISTING);
        this.loading.set(false);
      },
      error: (error) => this.failLoad(error),
    });
  }

  private loadTransaction(transactionId: string): void {
    this.loading.set(true);
    this.transactionsApi.byId(transactionId).subscribe({
      next: (transaction) => {
        this.show(transaction);
        this.loading.set(false);
        if (transaction.buyerReview || transaction.sellerReview) {
          this.reviewsApi.forTransaction(transactionId).subscribe({
            next: (reviews) => this.reviews.set(reviews),
          });
        }
      },
      error: (error) => this.failLoad(error),
    });
  }

  /**
   * Met la page sur une transaction. Sert a la lecture comme apres chaque
   * mutation : `createTransaction` et `updateTransaction` renvoient la
   * transaction a jour avec la meme selection de champs que `transaction(id)`,
   * la relire ensuite ne ferait qu'un aller-retour et un ecran de chargement de
   * plus.
   */
  private show(transaction: Transaction): void {
    this.transaction.set(transaction);
    this.listing.set(transaction.listingInfo);
    const isBuyer = transaction.buyerId === this.currentUserSub();
    this.role.set(isBuyer ? 'buyer' : 'seller');
    this.status.set(isBuyer ? transaction.buyerStatus : transaction.sellerStatus);
    this.selectedWeight.set(transaction.weight || 1);
  }

  /** Un introuvable garde l'ecran « aucun resultat » ; le reste propose de reessayer. */
  private failLoad(error: unknown): void {
    const notFound = error instanceof GraphQlError && error.classification === 'NOT_FOUND';
    this.loadError.set(notFound ? null : loadErrorKey(error));
    this.loading.set(false);
  }

  protected goBack(): void {
    history.length > 1 ? history.back() : void this.router.navigate(['/home']);
  }

  /** BROWSE_LISTING -> cree la transaction et bascule sur son detail. */
  protected async sendReservationRequest(): Promise<void> {
    const listing = this.listing() as Listing | null;
    const user = this.auth.userInfo();
    if (!listing || !user) return;

    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm_reservation_title'),
      message: this.i18n.t('confirm_reservation_message'),
      confirmText: this.i18n.t('confirm'),
      cancelText: this.i18n.t('cancel'),
      tone: 'primary',
    });
    if (!confirmed) return;

    const weight = this.selectedWeight();
    this.submitting.set(true);
    this.transactionsApi
      // On n'envoie que l'annonce et le poids : le back deduit l'acheteur du
      // token, le vendeur et le prix de l'annonce reelle, et pose les statuts
      // initiaux. Envoyer total / sellerId / buyerId ici n'aurait aucun effet.
      .create({
        listingId: listing.id,
        weight,
      })
      .subscribe({
        next: (created) => {
          this.submitting.set(false);
          this.show(created);
          // L'URL passe de l'annonce a la transaction, pour qu'un rechargement
          // ou un partage retombe dessus. Meme route : le composant est reutilise
          // et ne relit rien.
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { transactionId: created.id },
            replaceUrl: true,
          });
          this.confirm.inform(
            this.i18n.t('reservation_request_sent_title'),
            this.i18n.t('reservation_request_sent_message'),
          );
        },
        error: () => this.fail('reservation_request_error_message'),
      });
  }

  /** REQUEST_REJECTED -> nouvelle demande avec un poids different. */
  protected async sendNewRequest(): Promise<void> {
    const transaction = this.transaction();
    if (!transaction?.id) return;

    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm_new_request_title'),
      message: this.i18n.t('confirm_new_request_message'),
      confirmText: this.i18n.t('confirm'),
      cancelText: this.i18n.t('cancel'),
      tone: 'primary',
    });
    if (!confirmed) return;

    const weight = this.selectedWeight();
    this.update(
      transaction.id,
      {
        ...transaction,
        weight,
        sellerStatus: TRANSACTION_STATUS.RESERVATION_RECEIVED,
        buyerStatus: TRANSACTION_STATUS.WAITING_FOR_RESPONSE_BUYER,
      },
      'reservation_request_sent_title',
      'reservation_request_sent_message',
      'reservation_request_error_message',
    );
  }

  /** RESERVATION_RECEIVED -> le vendeur accepte : le poids sort du stock. */
  protected async acceptRequest(): Promise<void> {
    const transaction = this.transaction();
    if (!transaction?.id) return;

    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm_accept_request_title'),
      message: this.i18n.t('confirm_accept_request_message'),
      confirmText: this.i18n.t('confirm'),
      cancelText: this.i18n.t('cancel'),
      tone: 'primary',
    });
    if (!confirmed) return;

    // Le poids sort du stock cote back, dans la meme operation que le changement
    // de statut : transactionservice appelle tripservice sous verrou. Le faire
    // ici serait a la fois redondant et refuse (PUT /trips/{id} est reserve au
    // proprietaire de l'annonce).
    this.update(
      transaction.id,
      {
        ...transaction,
        sellerStatus: TRANSACTION_STATUS.AWAITING_PAYMENT,
        buyerStatus: TRANSACTION_STATUS.PAYMENT_REQUIRED,
      },
      'request_accepted_title',
      'request_accepted_message',
      'request_accepted_error_message',
    );
  }

  protected async declineRequest(): Promise<void> {
    const transaction = this.transaction();
    if (!transaction?.id) return;

    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm_decline_request_title'),
      message: this.i18n.t('confirm_decline_request_message'),
      confirmText: this.i18n.t('confirm'),
      cancelText: this.i18n.t('cancel'),
      tone: 'error',
    });
    if (!confirmed) return;

    this.update(
      transaction.id,
      {
        ...transaction,
        sellerStatus: TRANSACTION_STATUS.WAITING_FOR_RESPONSE_SELLER,
        buyerStatus: TRANSACTION_STATUS.REQUEST_REJECTED,
      },
      'request_declined_title',
      'request_declined_message',
      'request_declined_error_message',
    );
  }

  /**
   * PAYMENT_REQUIRED -> paiement.
   * stripeservice est desactive par defaut dans docker-compose.dev.yml (il lui
   * faut de vraies cles), donc on confirme le paiement sans passer par Stripe,
   * comme le ferait le callback onPaymentSuccess du mobile. Brancher le
   * paiement reel = appeler /stripe/create-payment-intent ici.
   */
  protected async completePayment(): Promise<void> {
    const transaction = this.transaction();
    if (!transaction?.id) return;

    const confirmed = await this.confirm.ask({
      title: this.i18n.t('complete_payment'),
      message: this.i18n.t('payment_without_stripe_message'),
      confirmText: this.i18n.t('confirm'),
      cancelText: this.i18n.t('cancel'),
      tone: 'primary',
    });
    if (!confirmed) return;

    this.update(
      transaction.id,
      {
        ...transaction,
        sellerStatus: TRANSACTION_STATUS.CONFIRMED,
        buyerStatus: TRANSACTION_STATUS.CONFIRMED,
      },
      'payment_completed_title',
      'payment_completed_message',
      'payment_completed_error_message',
    );
  }

  protected async cancelTransaction(): Promise<void> {
    const transaction = this.transaction();
    if (!transaction?.id) return;

    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm_cancel_transaction_title'),
      message: this.i18n.t('confirm_cancel_transaction_message'),
      confirmText: this.i18n.t('confirm'),
      cancelText: this.i18n.t('cancel'),
      tone: 'error',
    });
    if (!confirmed) return;

    this.update(
      transaction.id,
      {
        ...transaction,
        sellerStatus: TRANSACTION_STATUS.CANCELLED,
        buyerStatus: TRANSACTION_STATUS.CANCELLED,
      },
      'cancel_transaction_title',
      'cancel_transaction_message',
      'cancel_transaction_error_message',
    );
  }

  protected async markAsCompleted(): Promise<void> {
    const transaction = this.transaction();
    if (!transaction?.id) return;

    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm_mark_as_completed_title'),
      message: this.i18n.t('confirm_mark_as_completed_message'),
      confirmText: this.i18n.t('confirm'),
      cancelText: this.i18n.t('cancel'),
      tone: 'primary',
    });
    if (!confirmed) return;

    this.update(
      transaction.id,
      {
        ...transaction,
        sellerStatus: TRANSACTION_STATUS.COMPLETED,
        buyerStatus: TRANSACTION_STATUS.COMPLETED,
      },
      'confirmed_completed_title',
      'confirmed_completed_message',
      'confirmed_completed_error_message',
    );
  }

  protected openReviewModal(): void {
    this.editedReview.set(null);
    this.reviewModalOpen.set(true);
  }

  protected editReview(review: Review): void {
    this.editedReview.set(review);
    this.reviewModalOpen.set(true);
  }

  protected submitReview(draft: ReviewDraft): void {
    const transaction = this.transaction();
    const user = this.auth.userInfo();
    if (!transaction?.id || !user) return;

    const existing = this.editedReview();
    if (existing?.id) {
      this.reviewsApi.update(existing.id, { ...existing, ...draft }).subscribe({
        next: (updated) => {
          this.reviews.update((reviews) =>
            reviews.map((review) => (review.id === updated.id ? updated : review)),
          );
          this.confirm.inform(
            this.i18n.t('review_updated_title'),
            this.i18n.t('review_updated_message'),
          );
        },
        error: () => this.fail('review_updated_error_message'),
      });
      return;
    }

    const isBuyer = this.role() === 'buyer';
    // Auteur et destinataire sont deduits cote back : l'auteur vient du token et
    // le destinataire est l'autre partie de la transaction. Les envoyer d'ici
    // serait sans effet — c'est ce qui empeche de noter quelqu'un au hasard.
    this.reviewsApi
      .create({
        transactionId: transaction.id,
        ...draft,
      })
      .subscribe({
        next: (created) => {
          this.reviews.update((reviews) => [...reviews, created]);
          this.transactionsApi
            .update(transaction.id!, {
              ...transaction,
              buyerReview: isBuyer ? true : transaction.buyerReview,
              sellerReview: isBuyer ? transaction.sellerReview : true,
            })
            .subscribe({
              next: (updated) => {
                this.show(updated);
                this.confirm.inform(
                  this.i18n.t('review_submitted_title'),
                  this.i18n.t('review_submitted_message'),
                );
              },
              error: () => this.fail('review_submitted_error_message'),
            });
        },
        error: () => this.fail('review_submitted_error_message'),
      });
  }

  private update(
    id: string,
    payload: Partial<Transaction>,
    successTitle: Parameters<I18nService['t']>[0],
    successMessage: Parameters<I18nService['t']>[0],
    errorMessage: Parameters<I18nService['t']>[0],
  ): void {
    this.submitting.set(true);
    this.transactionsApi.update(id, payload).subscribe({
      next: (updated) => {
        this.submitting.set(false);
        this.show(updated);
        this.confirm.inform(this.i18n.t(successTitle), this.i18n.t(successMessage));
      },
      error: () => this.fail(errorMessage),
    });
  }

  private fail(messageKey: Parameters<I18nService['t']>[0]): void {
    this.submitting.set(false);
    this.confirm.inform(this.i18n.t('error'), this.i18n.t(messageKey));
  }
}
