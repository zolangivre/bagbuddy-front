import { Component, inject, input, model } from '@angular/core';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { TextField } from '../../shared/ui/text-field';

/** Meme borne que la colonne content_description cote transactionservice. */
export const CONTENT_MAX = 500;

const PROHIBITED: TranslationKey[] = [
  'prohibited_flammable',
  'prohibited_weapons',
  'prohibited_drugs',
  'prohibited_valuables',
  'prohibited_perishables',
  'prohibited_counterfeit',
];

/**
 * Declaration du contenu, avant d'envoyer une demande : ce que l'acheteur
 * confie au voyageur, et son engagement sur les objets interdits.
 *
 * C'est la protection du voyageur, qui passe la douane avec le colis d'un
 * inconnu : il lit la declaration avant d'accepter, et elle reste attachee a la
 * transaction. La liste des objets interdits est depliee par defaut la
 * premiere fois — on s'engage sur ce qu'on a lu, pas sur un lien.
 */
@Component({
  selector: 'bb-content-declaration',
  imports: [Icon, TextField],
  template: `
    <section class="bb-card">
      <h2 class="bb-card-title">
        <bb-icon name="box" [size]="22" />
        {{ i18n.t('content_declaration_title') }}
      </h2>
      <p class="bb-body-2 lede">{{ i18n.t('content_declaration_lede') }}</p>

      <bb-text-field
        [(value)]="description"
        [label]="i18n.t('content_description')"
        [placeholder]="i18n.t('content_description_placeholder')"
        [hint]="i18n.t('content_description_hint')"
        [multiline]="true"
        [rows]="3"
        [maxLength]="max"
        [required]="true"
        [error]="
          showErrors() && !String(description()).trim() ? i18n.t('error_content_required') : null
        "
      />

      <details class="prohibited" open>
        <summary class="bb-section-title">
          <bb-icon name="triangle-alert" [size]="18" />
          {{ i18n.t('prohibited_items_title') }}
        </summary>
        <ul class="bb-body-2">
          @for (key of prohibited; track key) {
            <li>{{ i18n.t(key) }}</li>
          }
        </ul>
      </details>

      <label class="accept">
        <input
          type="checkbox"
          [checked]="accepted()"
          [attr.aria-describedby]="showErrors() && !accepted() ? 'prohibited-error' : null"
          [attr.aria-invalid]="showErrors() && !accepted()"
          (change)="accepted.set($any($event.target).checked)"
        />
        <span>{{ i18n.t('prohibited_items_accept') }}</span>
      </label>
      @if (showErrors() && !accepted()) {
        <p id="prohibited-error" class="error">{{ i18n.t('error_prohibited_not_accepted') }}</p>
      }
    </section>
  `,
  styles: `
    .bb-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
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

    .lede {
      margin: 0;
    }

    .prohibited {
      padding: 12px 14px;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-yellow-a10);
      color: var(--bb-title);
    }

    summary {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    summary bb-icon {
      color: var(--bb-warning);
    }

    ul {
      margin: 10px 0 0;
      padding-left: 22px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .accept {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      color: var(--bb-title);
      cursor: pointer;
    }

    .accept input {
      flex: none;
      width: 20px;
      height: 20px;
      margin-top: 1px;
      accent-color: var(--bb-primary-strong);
    }

    .error {
      margin: 0;
      color: var(--bb-error);
      font-size: var(--bb-fs-body-3);
    }
  `,
})
export class ContentDeclaration {
  protected readonly i18n = inject(I18nService);
  protected readonly String = String;
  protected readonly max = CONTENT_MAX;
  protected readonly prohibited = PROHIBITED;

  readonly description = model<string | number>('');
  readonly accepted = model(false);
  /** Erreurs affichees apres une tentative d'envoi seulement. */
  readonly showErrors = input(false);
}
