import { Component, inject, input } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';

/**
 * La declaration d'une transaction existante, lue par les deux parties : le
 * voyageur avant d'accepter, l'acheteur pour se souvenir de ce qu'il a dit.
 */
@Component({
  selector: 'bb-declared-content',
  imports: [Icon],
  template: `
    <section class="bb-card">
      <h2 class="bb-card-title">
        <bb-icon name="box" [size]="22" />
        {{ i18n.t('declared_content_title') }}
      </h2>
      <p class="bb-body description">{{ description() }}</p>
      @if (accepted()) {
        <p class="bb-body-3 accepted">
          <bb-icon name="circle-check" [size]="16" />
          {{ i18n.t('prohibited_items_accepted_note') }}
        </p>
      }
    </section>
  `,
  styles: `
    .bb-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: var(--bb-title);
    }

    h2 bb-icon {
      color: var(--bb-primary);
    }

    .description {
      margin: 0;
      white-space: pre-line;
      color: var(--bb-title);
    }

    .accepted {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      color: var(--bb-success);
    }
  `,
})
export class DeclaredContent {
  protected readonly i18n = inject(I18nService);
  readonly description = input.required<string>();
  readonly accepted = input(false);
}
