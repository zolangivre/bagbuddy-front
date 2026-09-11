import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { GraphQlError } from '../../core/api/graphql.client';
import { LoadErrorKey, loadErrorKey } from '../../core/api/load-error';
import { ReviewsService } from '../../core/api/reviews.service';
import { TransactionsService } from '../../core/api/transactions.service';
import { TripsService } from '../../core/api/trips.service';
import { UsersService } from '../../core/api/users.service';
import { initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { PublicUserProfile, Review, UserInfoView } from '../../core/models';
import { Icon } from '../../shared/icon/icon';
import { IconButton } from '../../shared/ui/icon-button';
import { LoadError } from '../../shared/ui/load-error';
import { Loader } from '../../shared/ui/loader';
import { ReviewCard } from '../../shared/ui/review-card';
import { T } from '../../shared/ui/t';

/**
 * Portage de app/profile-view.js : profil public d'un autre utilisateur.
 * Le mobile passe l'objet userInfo en parametre de navigation ; ici la route
 * porte le `sub` et l'identite vient de `users.publicProfile(sub)` (nom, bio,
 * localisation — jamais email ni telephone).
 */
@Component({
  selector: 'bb-profile-view-page',
  imports: [T, IconButton, ReviewCard, Loader, LoadError, Icon],
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
            <span class="bb-body-3"><bb-t key="rating" /></span>
          </div>
          <div class="stat">
            <strong class="bb-title-md">{{ transactionCount() ?? 'N/A' }}</strong>
            <span class="bb-body-3"><bb-t key="transactions" /></span>
          </div>
        </section>

        @if (user()?.bio) {
          <section class="bb-card bio">
            <h2 class="bb-card-title">{{ i18n.t('bio') }}</h2>
            <p class="bb-body-2">{{ user()?.bio }}</p>
          </section>
        }

        @if (loadError(); as error) {
          <bb-load-error [messageKey]="error" (retry)="loadReviews()" />
        } @else if (reviews().length) {
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
  private readonly users = inject(UsersService);

  protected readonly sub = signal('');
  protected readonly user = signal<PublicUserProfile | UserInfoView | null>(null);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly averageRating = signal<number | null>(null);
  protected readonly transactionCount = signal<number | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<LoadErrorKey | null>(null);

  protected readonly initials = computed(() => initialsOf(this.user()?.name, 'NN'));

  constructor() {
    const sub = this.route.snapshot.paramMap.get('sub') ?? '';
    this.sub.set(sub);
    if (!sub) {
      this.loading.set(false);
      return;
    }

    this.loadReviews();
    this.transactions.countForUser(sub).subscribe({
      next: (count) => this.transactionCount.set(count),
    });
    this.loadIdentity(sub);
  }

  /**
   * Les annonces etaient la seule source de l'identite : un membre sans annonce
   * s'affichait sous son `sub` brut. Elles ne servent plus que de repli, pour un
   * membre qui n'a jamais ouvert l'app web — son profil userservice n'est cree
   * qu'a son premier `me`, et `user(sub)` repond NOT_FOUND d'ici la.
   */
  private loadIdentity(sub: string): void {
    this.users
      .publicProfile(sub)
      .pipe(
        // Seul NOT_FOUND vaut un repli : hors ligne ou service en panne, la
        // lecture des annonces echouerait de la meme facon.
        catchError((error: unknown) =>
          error instanceof GraphQlError && error.classification === 'NOT_FOUND'
            ? this.trips.byUser(sub).pipe(
                map((listings) => listings[0]?.userInfo ?? null),
                catchError(() => of(null)),
              )
            : of(null),
        ),
      )
      .subscribe((profile) => this.user.set(profile));
  }

  /** Avis et moyenne viennent du meme schema : une seule requete pour les deux. */
  protected loadReviews(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.reviewsApi.summaryForReviewee(this.sub()).subscribe({
      next: ({ reviews, average }) => {
        this.reviews.set(reviews);
        this.averageRating.set(average);
        this.loading.set(false);
      },
      error: (error) => {
        this.loadError.set(loadErrorKey(error));
        this.loading.set(false);
      },
    });
  }

  protected goBack(): void {
    history.length > 1 ? history.back() : void this.router.navigate(['/home']);
  }
}
