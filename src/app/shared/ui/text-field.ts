import { Component, computed, inject, input, model, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../icon/icon';

/**
 * Le label est explicite (`for` / `id`) plutot qu'englobant : sinon la bascule
 * « afficher le mot de passe » et l'aide de saisie entrent dans le nom
 * accessible du champ, qu'un lecteur d'ecran annonce alors en entier.
 */
let nextFieldId = 0;

/** Portage de components/Input.js et NumberInput.js. */
@Component({
  selector: 'bb-text-field',
  imports: [Icon],
  template: `
    <div class="field">
      @if (label()) {
        <label class="bb-body-2" [id]="id + '-label'" [attr.for]="id">{{ label() }}</label>
      }
      @if (multiline()) {
        <textarea
          [id]="id"
          [value]="value()"
          [placeholder]="placeholder()"
          [rows]="rows()"
          [attr.autocomplete]="autocomplete() || null"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-invalid]="!!error()"
          (input)="onInput($event)"
        ></textarea>
      } @else {
        <span class="control">
          <input
            [id]="id"
            [type]="effectiveType()"
            [value]="value()"
            [placeholder]="placeholder()"
            [attr.min]="minValue()"
            [attr.max]="maxValue()"
            [attr.step]="stepValue()"
            [attr.autocomplete]="autocomplete() || null"
            [attr.aria-describedby]="describedBy()"
            [attr.aria-invalid]="!!error()"
            (input)="onInput($event)"
          />
          @if (revealable()) {
            <!--
              La bascule porte le meme libelle sur tous les champs d'un
              formulaire de mot de passe : on la rattache au label du champ,
              qui est alors annonce a la suite (« Afficher le mot de passe,
              Mot de passe actuel »).
            -->
            <button
              type="button"
              class="reveal"
              [attr.aria-label]="revealed() ? i18n.t('hide_password') : i18n.t('show_password')"
              [attr.aria-describedby]="label() ? id + '-label' : null"
              [attr.aria-pressed]="revealed()"
              (click)="revealed.set(!revealed())"
            >
              <bb-icon [name]="revealed() ? 'eye-off' : 'eye'" [size]="20" />
            </button>
          }
        </span>
      }
      @if (hint(); as text) {
        <span class="hint" [id]="id + '-hint'">{{ text }}</span>
      }
      @if (error(); as message) {
        <span class="error" [id]="id + '-error'">{{ message }}</span>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      flex: 1;
      min-width: 0;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .control {
      position: relative;
      display: block;
    }

    input,
    textarea {
      width: 100%;
      border: 1px solid transparent;
      border-radius: var(--bb-radius);
      background: var(--bb-input);
      color: var(--bb-title);
      padding: 12px;
      font-family: inherit;
      font-size: var(--bb-fs-body);
    }

    input {
      height: 48px;
      padding: 0 12px;
    }

    textarea {
      resize: vertical;
    }

    input[aria-invalid='true'],
    textarea[aria-invalid='true'] {
      border-color: var(--bb-error);
    }

    /* Champ mot de passe : la bascule occupe la droite du champ. */
    .control:has(.reveal) input {
      padding-right: 48px;
    }

    .reveal {
      position: absolute;
      top: 0;
      right: 0;
      width: 48px;
      height: 48px;
      border: none;
      background: transparent;
      color: var(--bb-text);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .hint {
      font-size: var(--bb-fs-body-3);
      color: var(--bb-text);
    }

    .error {
      font-size: var(--bb-fs-body-3);
      color: var(--bb-error);
    }
  `,
})
export class TextField {
  protected readonly i18n = inject(I18nService);

  readonly label = input('');
  readonly placeholder = input('');
  readonly type = input<'text' | 'number' | 'datetime-local' | 'email' | 'tel' | 'password'>(
    'text',
  );
  readonly multiline = input(false);
  readonly rows = input(4);
  readonly minValue = input<number | null>(null);
  readonly maxValue = input<number | null>(null);
  readonly stepValue = input<string | number | null>(null);
  /** Valeur de l'attribut autocomplete : les gestionnaires de mots de passe en dependent. */
  readonly autocomplete = input('');
  /** Ajoute la bascule oeil sur un champ mot de passe. */
  readonly revealable = input(false);
  /** Regle a annoncer avant la saisie (longueur minimale, format attendu). */
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly value = model<string | number>('');

  protected readonly id = `bb-field-${nextFieldId++}`;
  protected readonly revealed = signal(false);

  /** Aide et message d'erreur : decrits, pas nommes. */
  protected readonly describedBy = computed(() => {
    const ids = [this.hint() ? `${this.id}-hint` : null, this.error() ? `${this.id}-error` : null];
    return ids.filter(Boolean).join(' ') || null;
  });
  protected readonly effectiveType = computed(() =>
    this.revealable() && this.revealed() ? 'text' : this.type(),
  );

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }
}
