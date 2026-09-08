import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReviewsService } from '../../core/api/reviews.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Review } from '../../core/models';
import { Loader } from '../../shared/ui/loader';
import { ReviewCard } from '../../shared/ui/review-card';
import { SubHeader } from '../../shared/ui/sub-header';

/** Portage de app/all-reviews.js. */
@Component({
  selector: 'bb-all-reviews-page',
  imports: [SubHeader, ReviewCard, Loader],
  template: `
    <bb-sub-header [title]="i18n.t('all_reviews')" (back)="goBack()" />

    <div class="bb-page content">
      @if (loading()) {
        <bb-loader [label]="i18n.t('loading')" />
      } @else if (reviews().length) {
        @for (review of reviews(); track review.id) {
          <div class="bb-card">
            <bb-review-card [review]="review" />
          </div>
        }
      } @else {
        <p class="bb-empty">{{ i18n.t('no_reviews_yet') }}</p>
      }
    </div>
  `,
  styles: `
    .content {
      padding-top: 16px;
      padding-bottom: 40px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      max-width: 720px;
    }
  `,
})
export class AllReviewsPage {
  protected readonly i18n = inject(I18nService);
  private readonly reviewsApi = inject(ReviewsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly reviews = signal<Review[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    const sub = this.auth.userInfo()?.sub;
    if (!sub) {
      this.loading.set(false);
      return;
    }
    this.reviewsApi.forReviewee(sub).subscribe({
      next: (reviews) => {
        this.reviews.set(Array.isArray(reviews) ? reviews : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected goBack(): void {
    history.length > 1 ? history.back() : void this.router.navigate(['/profile']);
  }
}
