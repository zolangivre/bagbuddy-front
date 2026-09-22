import { Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { IconButton } from './icon-button';

/** Barre haute des ecrans secondaires (globalStyles.header du mobile). */
@Component({
  selector: 'bb-sub-header',
  imports: [IconButton],
  template: `
    <header>
      <div class="inner">
        <bb-icon-button
          icon="arrow-left"
          data-variant="ghost"
          [label]="i18n.t('back')"
          (pressed)="back.emit()"
        />
        <h1 class="bb-section-title">{{ title() }}</h1>
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    header {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bb-card);
      border-bottom: 1px solid var(--bb-border);
    }

    .inner {
      max-width: 1120px;
      margin: 0 auto;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    h1 {
      flex: 1;
      min-width: 0;
      margin: 0;
    }
  `,
})
export class SubHeader {
  protected readonly i18n = inject(I18nService);
  readonly title = input('');
  readonly back = output<void>();
}
