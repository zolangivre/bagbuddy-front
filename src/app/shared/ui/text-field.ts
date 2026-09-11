import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
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
          #control
          [id]="id"
          [value]="value()"
          [placeholder]="placeholder()"
          [rows]="rows()"
          [disabled]="disabled()"
          [attr.maxlength]="maxLength() ?? null"
          [attr.autocomplete]="autocomplete() || null"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-invalid]="!!error()"
          [attr.aria-required]="required() || null"
          (input)="onInput($event)"
          (blur)="onBlur()"
        ></textarea>
      } @else {
        <span class="control">
          <input
            #control
            [id]="id"
            [type]="effectiveType()"
            [value]="value()"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [attr.min]="minValue()"
            [attr.max]="maxValue()"
            [attr.step]="stepValue()"
            [attr.maxlength]="maxLength() ?? null"
            [attr.autocomplete]="autocomplete() || null"
            [attr.aria-describedby]="describedBy()"
            [attr.aria-invalid]="!!error()"
            [attr.aria-required]="required() || null"
            (input)="onInput($event)"
            (blur)="onBlur()"
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
              [disabled]="disabled()"
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

    /* Pendant un envoi : la saisie reste lisible, mais on voit qu'elle est figee. */
    input:disabled,
    textarea:disabled,
    .reveal:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

  // Etat pose par la directive [formField] de Signal Forms quand le champ en
  // porte un : desactivation (pendant un envoi), obligation, longueur maximale.
  readonly disabled = input(false);
  readonly required = input(false);
  readonly maxLength = input<number | undefined>(undefined);
  /**
   * Emis au blur d'un champ rempli : Signal Forms le marque alors « touche », et
   * une saisie invalide (format, longueur, confirmation) se signale en quittant
   * le champ plutot qu'au seul envoi. Un champ laisse vide ne l'est pas : on ne
   * reproche pas « obligatoire » a qui ne fait que traverser le formulaire, et
   * le message qui apparaitrait sous le dernier champ au moment de cliquer sur
   * « Envoyer » decalerait le bouton sous le pointeur. L'envoi marque tout.
   */
  readonly touch = output<void>();

  private readonly control =
    viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('control');

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

  /** Appele par `focusBoundControl()` : le focus va au champ, pas a l'hote. */
  focus(options?: FocusOptions): void {
    this.control()?.nativeElement.focus(options);
  }

  protected onBlur(): void {
    if (String(this.value() ?? '') !== '') this.touch.emit();
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }
}
