import { Component, computed, inject, input, model } from '@angular/core';
import { CurrencyService } from '../../core/currency.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ListingInfo } from '../../core/models';
import { Icon } from '../../shared/icon/icon';

/** Portage de components/WeightSelectorCard.js. */
@Component({
  selector: 'bb-weight-selector',
  imports: [Icon],
  template: `
    <section class="bb-card">
      <h2 class="bb-card-title">
        <bb-icon name="scale" [size]="24" />
        {{ i18n.t('select_weight_to_approve') }}
      </h2>

      <p class="bb-body-2 centered">
        {{ i18n.t('select_weight_to_approve_description', { weight: maxWeight() }) }}
      </p>

      <div class="controls">
        <button
          type="button"
          [attr.aria-label]="i18n.t('decrease_weight')"
          [disabled]="weight() <= 1"
          (click)="change(-1)"
        >
          <bb-icon name="minus" [size]="24" />
        </button>

        <label class="display">
          <span class="sr-only">{{ i18n.t('select_weight_to_approve') }}</span>
          <input
            type="number"
            [value]="weight()"
            min="1"
            [max]="maxWeight()"
            (input)="onInput($event)"
          />
          <span class="bb-body-2">{{ i18n.t('kilograms') }}</span>
        </label>

        <button
          type="button"
          [attr.aria-label]="i18n.t('increase_weight')"
          [disabled]="weight() >= maxWeight()"
          (click)="change(1)"
        >
          <bb-icon name="plus" [size]="24" />
        </button>
      </div>

      <div class="slider">
        <div class="track"><div class="fill" [style.width.%]="percent()"></div></div>
        <div class="labels">
          <span class="bb-body-2">1kg</span>
          <span class="bb-body-2">{{ maxWeight() }}kg</span>
        </div>
      </div>

      <p class="price">
        <span class="bb-body-2">{{ i18n.t('price') }} :</span>
        <strong>{{ currency.format(totalPrice()) }}</strong>
      </p>
    </section>
  `,
  styles: `
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 20px;
    }

    h2 bb-icon {
      color: var(--bb-primary);
    }

    .centered {
      text-align: center;
      margin: 0 0 20px;
    }

    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .controls button {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      border: 1px solid var(--bb-cyan-a20);
      background: var(--bb-subtle);
      color: var(--bb-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .controls button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .display {
      width: 120px;
      min-height: 76px;
      background: var(--bb-cyan-a05);
      border-radius: var(--bb-radius);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px;
    }

    .display input {
      width: 100%;
      border: none;
      background: transparent;
      text-align: center;
      font-size: var(--bb-fs-h2);
      font-weight: 700;
      color: var(--bb-primary);
      font-family: inherit;
    }

    .slider {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }

    .track {
      height: 8px;
      border-radius: 12px;
      background: var(--bb-input);
      overflow: hidden;
    }

    .fill {
      height: 100%;
      background: var(--bb-primary);
      border-radius: 12px;
    }

    .labels {
      display: flex;
      justify-content: space-between;
    }

    .price {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin: 0;
    }

    .price strong {
      color: var(--bb-primary);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  `,
})
export class WeightSelector {
  protected readonly i18n = inject(I18nService);
  protected readonly currency = inject(CurrencyService);

  readonly listing = input.required<ListingInfo>();
  readonly weight = model(1);

  protected readonly maxWeight = computed(() => Math.max(1, this.listing().remainingWeight));
  protected readonly totalPrice = computed(() => this.weight() * this.listing().pricePerKg);
  protected readonly percent = computed(() => (this.weight() / this.maxWeight()) * 100);

  protected change(delta: number): void {
    this.setWeight(this.weight() + delta);
  }

  protected onInput(event: Event): void {
    this.setWeight(Number.parseInt((event.target as HTMLInputElement).value, 10));
  }

  private setWeight(value: number): void {
    if (!Number.isFinite(value)) return;
    this.weight.set(Math.min(Math.max(1, value), this.maxWeight()));
  }
}
