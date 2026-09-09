import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewsService } from '../../core/api/reviews.service';
import { TransactionsService } from '../../core/api/transactions.service';
import { TripsService } from '../../core/api/trips.service';
import { initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Review, UserInfoView } from '../../core/models';
import { Icon } from '../../shared/icon/icon';
import { IconButton } from '../../shared/ui/icon-button';
import { Loader } from '../../shared/ui/loader';
import { ReviewCard } from '../../shared/ui/review-card';

/**
 * Portage de app/profile-view.js : profil public d'un autre utilisateur.
 * Le mobile passe l'objet userInfo en parametre de navigation ; ici la route
 * porte le `sub` et le profil est retrouve via les annonces actives, seule
 * source publique de ces informations (il n'y a pas de route /users cote back).
 */
@Component({
  selector: 'bb-profile-view-page',
  imports: [IconButton, ReviewCard, Loader, Icon],
  template: `
    <header class="bb-header-gradient">
      <div class="inner">
        <bb-icon-button
          icon="arrow-left"
          data-variant="on-gradient"
          [iconSize]="24"
          [label]="i18n.t('back')"
          (pressed)="goBack()"
        />
        <div class="who">
          <span class="avatar" aria-hidden="true">{{ initials() }}</span>
          <div>
            <h1>{{ user()?.name ?? sub() }}</h1>
            <p>{{ user()?.location }}</p>
          </div>
        </div>
      </div>
    </header>

    <div class="bb-page content">
      @if (loading()) {
        <bb-loader [label]="i18n.t('loading')" />
      } @else {
        <section class="bb-card stats">
          <div class="stat">
            <span class="rating">
              <bb-icon name="star" [size]="20" fill="currentColor" />
              <strong class="bb-title-md">{{
                averageRating() === null ? 'N/A' : averageRating()!.toFixed(1)
              }}</strong>
            </span>
            <span class="bb-body-3">{{ i18n.t('rating') }}</span>
          </div>
          <div class="stat">
            <strong class="bb-title-md">{{ transactionCount() ?? 'N/A' }}</strong>
            <span class="bb-body-3">{{ i18n.t('transactions') }}</span>
          </div>
        </section>

        @if (user()?.bio) {
          <section class="bb-card bio">
            <h2 class="bb-card-title">{{ i18n.t('bio') }}</h2>
            <p class="bb-body-2">{{ user()?.bio }}</p>
          </section>
        }

        @if (reviews().length) {
          @for (review of reviews(); track review.id) {
            <div class="bb-card">
              <bb-review-card [review]="review" />
            </div>
          }
        } @else {
          <p class="bb-empty">{{ i18n.t('no_reviews_yet') }}</p>
        }
      }
    </div>
  `,
  styles: `
    header {
      padding: 24px 0 60px;
    }

    .inner {
      max-width: 1120px;
      margin: 0 auto;
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .who {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 999px;
      background: var(--bb-white);
      color: var(--bb-primary);
      font-size: 2rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
    }

    h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
    }

    p {
      margin: 0;
      color: var(--bb-very-light-grey);
    }

    .content {
      margin-top: -50px;
      padding-bottom: 40px;
      display: flex;
      flex-direction: column;
      gap: 25px;
      position: relative;
      z-index: 1;
    }

    .stats {
      display: flex;
      align-items: center;
      justify-content: space-around;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .rating {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--bb-warning);
    }

    .bio h2 {
      margin: 0 0 8px;
      text-align: center;
    }

    .bio p {
      color: var(--bb-text);
      text-align: center;
    }
  `,
})
export class ProfileViewPage {
  protected readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reviewsApi = inject(ReviewsService);
  private readonly transactions = inject(TransactionsService);
  private readonly trips = inject(TripsService);

  protected readonly sub = signal('');
  protected readonly user = signal<UserInfoView | null>(null);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly averageRating = signal<number | null>(null);
  protected readonly transactionCount = signal<number | null>(null);
  protected readonly loading = signal(true);

  protected readonly initials = computed(() => initialsOf(this.user()?.name, 'NN'));

  constructor() {
    const sub = this.route.snapshot.paramMap.get('sub') ?? '';
    this.sub.set(sub);
    if (!sub) {
      this.loading.set(false);
      return;
    }

    this.reviewsApi.forReviewee(sub).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.reviewsApi.averageForReviewee(sub).subscribe({
      next: (average) => this.averageRating.set(average),
      error: () => this.averageRating.set(null),
    });
    this.transactions.countForUser(sub).subscribe({
      next: (count) => this.transactionCount.set(count),
    });
    this.trips.byUser(sub).subscribe({
      next: (listings) => {
        if (listings.length) this.user.set(listings[0].userInfo);
      },
    });
  }

  protected goBack(): void {
    history.length > 1 ? history.back() : void this.router.navigate(['/home']);
  }
}
