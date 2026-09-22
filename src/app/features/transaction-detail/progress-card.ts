import { Component, computed, inject, input } from '@angular/core';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Role } from '../../core/models';
import { Icon } from '../../shared/icon/icon';
import { ProgressBar } from '../../shared/ui/progress-bar';

interface Step {
  number: number;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}

const BUYER_STEPS: Step[] = [
  { number: 1, titleKey: 'step_one_title_buyer', descriptionKey: 'step_one_description_buyer' },
  { number: 2, titleKey: 'step_two_title_buyer', descriptionKey: 'step_two_description_buyer' },
  { number: 3, titleKey: 'step_three_title_buyer', descriptionKey: 'step_three_description_buyer' },
  { number: 4, titleKey: 'step_four_title_buyer', descriptionKey: 'step_four_description_buyer' },
];

const SELLER_STEPS: Step[] = [
  { number: 1, titleKey: 'step_one_title_seller', descriptionKey: 'step_one_description_seller' },
  { number: 2, titleKey: 'step_two_title_seller', descriptionKey: 'step_two_description_seller' },
  {
    number: 3,
    titleKey: 'step_three_title_seller',
    descriptionKey: 'step_three_description_seller',
  },
];

/** Portage de components/TransactionProgressCard.js. */
@Component({
  selector: 'bb-progress-card',
  imports: [ProgressBar, Icon],
  template: `
    <section class="bb-card">
      <div class="head">
        <h2 class="bb-card-title">{{ i18n.t('transaction_progress') }}</h2>
        <span class="bb-body-2">{{ step() }} {{ i18n.t('of') }} {{ steps().length }}</span>
      </div>

      <bb-progress-bar
        [step]="step()"
        [totalSteps]="steps().length"
        [label]="i18n.t('transaction_progress')"
      />

      <ol class="steps">
        @for (item of steps(); track item.number; let index = $index) {
          <li>
            <span
              class="bullet"
              [class.active]="step() === index"
              [class.done]="step() > index"
              aria-hidden="true"
            >
              @if (step() > index) {
                <bb-icon name="check" [size]="18" />
              } @else {
                {{ item.number }}
              }
            </span>
            <span class="text">
              <span class="title" [class.active]="step() === index" [class.done]="step() > index">{{
                i18n.t(item.titleKey)
              }}</span>
              <span class="bb-body-2">{{ i18n.t(item.descriptionKey) }}</span>
            </span>
          </li>
        }
      </ol>
    </section>
  `,
  styles: `
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    h2 {
      margin: 0;
    }

    bb-progress-bar {
      display: block;
      margin-bottom: 20px;
    }

    .steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    li {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .bullet {
      width: 32px;
      height: 32px;
      flex: none;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--bb-subtle);
      color: var(--bb-title);
      font-weight: 500;
    }

    .bullet.active {
      background: var(--bb-primary-strong);
      color: var(--bb-white);
    }

    .bullet.done {
      background: var(--bb-success-strong);
      color: var(--bb-white);
    }

    .text {
      display: flex;
      flex-direction: column;
    }

    .title {
      font-size: var(--bb-fs-h4);
      font-weight: 500;
      color: var(--bb-text);
    }

    .title.active {
      color: var(--bb-primary);
    }

    .title.done {
      color: var(--bb-title);
    }
  `,
})
export class ProgressCard {
  protected readonly i18n = inject(I18nService);

  readonly step = input(0);
  readonly role = input<Role>('buyer');

  protected readonly steps = computed(() => (this.role() === 'buyer' ? BUYER_STEPS : SELLER_STEPS));
}
