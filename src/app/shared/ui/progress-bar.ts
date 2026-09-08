import { Component, computed, input } from '@angular/core';

/** Portage de components/ProgressBar.js. */
@Component({
  selector: 'bb-progress-bar',
  template: `
    <div
      class="track"
      role="progressbar"
      [attr.aria-valuenow]="step()"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="totalSteps()"
      [attr.aria-label]="label()"
    >
      <div class="fill" [style.width.%]="percent()"></div>
    </div>
  `,
  styles: `
    .track {
      width: 100%;
      height: 9px;
      border-radius: 999px;
      background: rgba(14, 165, 233, 0.1);
      overflow: hidden;
    }

    .fill {
      height: 100%;
      border-radius: 999px;
      background: var(--bb-primary);
      transition: width 0.25s ease;
    }
  `,
})
export class ProgressBar {
  readonly step = input(0);
  readonly totalSteps = input(4);
  readonly label = input('Progression');

  protected readonly percent = computed(() => {
    const total = this.totalSteps();
    const clamped = Math.max(0, Math.min(this.step(), total));
    return total === 0 ? 0 : (clamped / total) * 100;
  });
}
