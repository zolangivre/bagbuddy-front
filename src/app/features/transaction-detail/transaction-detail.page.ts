import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
        return 0;
      case TRANSACTION_STATUS.WAITING_FOR_RESPONSE_BUYER:
      case TRANSACTION_STATUS.WAITING_FOR_RESPONSE_SELLER:
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
    const params = this.route.snapshot.queryParamMap;
    const transactionId = params.get('transactionId');
    const listingId = params.get('listingId');

    if (transactionId) {
      this.loadTransaction(transactionId);
    } else if (listingId) {
      this.loadListing(listingId);
    } else {
      this.loading.set(false);
    }
  }

  private loadListing(listingId: string): void {
    this.trips.byId(listingId).subscribe({
      next: (listing) => {
        this.listing.set(listing);
        this.role.set(listing.userId === this.currentUserSub() ? 'seller' : 'buyer');
        this.status.set(TRANSACTION_STATUS.BROWSE_LISTING);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadTransaction(transactionId: string): void {
    this.transactionsApi.byId(transactionId).subscribe({
      next: (transaction) => {
        this.transaction.set(transaction);
        this.listing.set(transaction.listingInfo);
        const isBuyer = transaction.buyerId === this.currentUserSub();
        this.role.set(isBuyer ? 'buyer' : 'seller');
        this.status.set(isBuyer ? transaction.buyerStatus : transaction.sellerStatus);
        this.selectedWeight.set(transaction.weight || 1);
        this.loading.set(false);
        if (transaction.buyerReview || transaction.sellerReview) {
          this.reviewsApi.forTransaction(transactionId).subscribe({
            next: (reviews) => this.reviews.set(reviews),
          });
        }
      },
      error: () => this.loading.set(false),
    });
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
      .create({
        listingId: listing.id,
        listingInfo: {
          ...listing,
          sellerUserInfo: listing.userInfo,
        },
        sellerId: listing.userId,
        buyerId: user.sub,
        buyerInfo: user,
        weight,
        sellerStatus: TRANSACTION_STATUS.RESERVATION_RECEIVED,
        buyerStatus: TRANSACTION_STATUS.WAITING_FOR_RESPONSE_BUYER,
        total: weight * listing.pricePerKg,
      })
      .subscribe({
        next: (created) => {
          this.submitting.set(false);
          this.confirm.inform(
            this.i18n.t('reservation_request_sent_title'),
            this.i18n.t('reservation_request_sent_message'),
          );
          this.reload(created.id);
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
        total: weight * transaction.listingInfo.pricePerKg,
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

    this.submitting.set(true);
    const listing = transaction.listingInfo;
    if (transaction.listingId) {
      this.trips
        .update(transaction.listingId, {
          ...listing,
          remainingWeight: listing.remainingWeight - transaction.weight,
        })
        .subscribe({ error: () => undefined });
    }

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
        paidAt: new Date().toISOString(),
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
        next: () => {
          this.confirm.inform(
            this.i18n.t('review_updated_title'),
            this.i18n.t('review_updated_message'),
          );
          this.reload(transaction.id);
        },
        error: () => this.fail('review_updated_error_message'),
      });
      return;
    }

    const isBuyer = this.role() === 'buyer';
    this.reviewsApi
      .create({
        transactionId: transaction.id,
        reviewerId: user.sub,
        reviewerName: user.name,
        revieweeId: isBuyer ? transaction.sellerId : transaction.buyerId,
        revieweeName: isBuyer
          ? transaction.listingInfo.sellerUserInfo?.name
          : transaction.buyerInfo?.name,
        ...draft,
      })
      .subscribe({
        next: () => {
          this.transactionsApi
            .update(transaction.id!, {
              ...transaction,
              buyerReview: isBuyer ? true : transaction.buyerReview,
              sellerReview: isBuyer ? transaction.sellerReview : true,
            })
            .subscribe({
              next: () => {
                this.confirm.inform(
                  this.i18n.t('review_submitted_title'),
                  this.i18n.t('review_submitted_message'),
                );
                this.reload(transaction.id);
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
        this.confirm.inform(this.i18n.t(successTitle), this.i18n.t(successMessage));
        this.reload(updated.id ?? id);
      },
      error: () => this.fail(errorMessage),
    });
  }

  private fail(messageKey: Parameters<I18nService['t']>[0]): void {
    this.submitting.set(false);
    this.confirm.inform(this.i18n.t('error'), this.i18n.t(messageKey));
  }

  /** Recharge la page sur la transaction (equivalent du router.replace mobile). */
  private reload(transactionId: string | undefined): void {
    if (!transactionId) return;
    void this.router.navigate(['/transaction-detail'], {
      queryParams: { transactionId },
      onSameUrlNavigation: 'reload',
      replaceUrl: true,
    });
    this.loading.set(true);
    this.loadTransaction(transactionId);
  }
}
