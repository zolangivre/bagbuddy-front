import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { Review } from '../../core/models';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { Modal } from '../../shared/ui/modal';
import { TextField } from '../../shared/ui/text-field';

export interface ReviewDraft {
  rating: number;
  comment: string;
}

/** Portage de components/ReviewModal.js. */
@Component({
  selector: 'bb-review-modal',
  imports: [Modal, Button, TextField, Icon],
  template: `
    <bb-modal
      [open]="open()"
      [title]="i18n.t('leave_a_review')"
      [closeLabel]="i18n.t('close')"
      (closed)="open.set(false)"
    >
      <div class="stars" role="radiogroup" [attr.aria-label]="i18n.t('leave_a_review')">
        @for (star of stars; track star) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="rating() === star"
            [attr.aria-label]="star + ' / 5'"
            (click)="rating.set(star)"
          >
            <bb-icon
              name="star"
              [size]="32"
              [fill]="star <= rating() ? 'currentColor' : 'none'"
              [style.color]="star <= rating() ? 'var(--bb-warning)' : 'var(--bb-border)'"
            />
          </button>
        }
      </div>

      <bb-text-field
        [label]="i18n.t('write_your_review')"
        [multiline]="true"
        [rows]="4"
        [(value)]="comment"
        [error]="error()"
      />

      <bb-button [text]="i18n.t('submit_review')" (pressed)="submit()" />
    </bb-modal>
  `,
  styles: `
    .stars {
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .stars button {
      border: none;
      background: transparent;
      padding: 4px;
      border-radius: 8px;
      display: inline-flex;
    }
  `,
})
export class ReviewModal {
  protected readonly i18n = inject(I18nService);

  readonly open = model(false);
  /** Avis existant a modifier ; absent = nouvel avis. */
  readonly review = input<Review | null>(null);
  readonly submitted = output<ReviewDraft>();

  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly rating = signal(0);
  protected readonly comment = signal('');
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (!this.open()) return;
      const review = this.review();
      this.rating.set(review?.rating ?? 0);
      this.comment.set(review?.comment ?? '');
      this.error.set(null);
    });
  }

  protected submit(): void {
    if (this.rating() === 0) {
      this.error.set(this.i18n.t('error_no_rating'));
      return;
    }
    if (!this.comment().trim()) {
      this.error.set(this.i18n.t('error_no_comment'));
      return;
    }
    this.error.set(null);
    this.submitted.emit({ rating: this.rating(), comment: this.comment().trim() });
    this.open.set(false);
  }
}
