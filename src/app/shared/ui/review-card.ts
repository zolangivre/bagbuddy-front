import { Component, computed, inject, input, output } from '@angular/core';
import { formatLocalizedDate, initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Review } from '../../core/models';
import { Icon } from '../icon/icon';
import { Avatar } from './avatar';
import { IconButton } from './icon-button';

/** Portage de components/ReviewCard.js. */
@Component({
  selector: 'bb-review-card',
  imports: [Avatar, Icon, IconButton],
  template: `
    <article class="review">
      <bb-avatar [initials]="initials()" [size]="40" />
      <div class="body">
        <div class="head">
          <span class="bb-section-title">{{ review().reviewerName }}</span>
          <span class="bb-body-3">{{ date() }}</span>
        </div>
        <div class="stars" role="img" [attr.aria-label]="ratingLabel()">
          @for (star of stars; track star) {
            <bb-icon
              name="star"
              [size]="16"
              [fill]="star <= review().rating ? 'currentColor' : 'none'"
              [style.color]="star <= review().rating ? 'var(--bb-warning)' : 'var(--bb-border)'"
            />
          }
        </div>
        <p class="bb-body-2">{{ review().comment }}</p>
      </div>
      @if (editable()) {
        <bb-icon-button
          icon="pencil"
          [label]="i18n.t('edit_review')"
          (pressed)="edit.emit(review())"
        />
      }
    </article>
  `,
  styles: `
    .review {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .stars {
      display: flex;
      gap: 2px;
    }

    p {
      margin: 0;
    }
  `,
})
export class ReviewCard {
  protected readonly i18n = inject(I18nService);
  readonly review = input.required<Review>();
  readonly editable = input(false);
  readonly edit = output<Review>();

  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly initials = computed(() => initialsOf(this.review().reviewerName));
  protected readonly date = computed(() =>
    formatLocalizedDate(this.review().createdAt, this.i18n.language()),
  );
  protected readonly ratingLabel = computed(() => `${this.review().rating} / 5`);
}
