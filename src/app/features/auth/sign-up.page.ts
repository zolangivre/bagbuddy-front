import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import {
  disabled,
  email,
  FieldTree,
  form,
  FormField,
  maxLength,
  minLength,
  required,
  submit,
  validate,
  ValidationError,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GraphQlError } from '../../core/api/graphql.client';
import { loadErrorKey } from '../../core/api/load-error';
import { UsersService } from '../../core/api/users.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { TextField } from '../../shared/ui/text-field';
import { T } from '../../shared/ui/t';
import { AuthShell } from './auth-shell';

interface SignUpForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Ou en est l'envoi : il enchaine deux appels, et le bouton dit lequel. */
type Step = 'idle' | 'creating' | 'signing_in';

/**
 * Erreurs renvoyees par userservice et rattachees a un champ. Le `kind` porte le
 * code : le message est retraduit a l'affichage, pour suivre la langue.
 */
const SERVER_FIELD_ERRORS: Record<string, TranslationKey> = {
  email_already_used: 'error_email_already_used',
  password_rejected: 'error_password_rejected',
};

/** Memes bornes que RegisterRequest cote userservice : un depassement y serait un BAD_REQUEST. */
const NAME_MAX = 60;
const EMAIL_MAX = 255;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

/**
 * Inscription. Le realm Keycloak n'ouvre pas sa propre page d'inscription :
 * c'est userservice qui cree le compte (mutation `register`), puis on enchaine
 * sur une connexion normale — l'utilisateur ne voit qu'un formulaire.
 *
 * Trois familles d'echec, trois traitements :
 * - un probleme propre a un champ (email deja pris, mot de passe refuse par la
 *   politique du realm) devient une erreur de ce champ, via `submit()` de Signal
 *   Forms : elle s'efface des que la valeur change, et le focus y est porte ;
 * - un probleme general (reseau, service indisponible) s'affiche en tete de
 *   formulaire et laisse renvoyer tel quel — une erreur de soumission bloquerait
 *   le renvoi tant qu'aucun champ n'a change ;
 * - un compte cree dont la connexion automatique echoue n'est pas un echec : on
 *   le dit, et on envoie vers la connexion plutot que de laisser renvoyer un
 *   formulaire qui repondrait « email deja utilise ».
 */
@Component({
  selector: 'bb-sign-up-page',
  imports: [T, RouterLink, FormField, AuthShell, TextField, Button, Icon],
  template: `
    <bb-auth-shell titleKey="sign_up_title" ledeKey="sign_up_lede">
      @if (createdEmail(); as address) {
        <div class="created">
          <div #notice class="bb-alert bb-alert--success" role="status" tabindex="-1">
            <bb-icon name="circle-check" [size]="20" />
            <div>
              <p class="notice-title">{{ i18n.t('account_created_title') }}</p>
              <p>{{ i18n.t('account_created_sign_in') }}</p>
            </div>
          </div>
          <bb-button (pressed)="goToSignIn(address)">
            <bb-t key="sign_in" />
            <bb-icon slot="right" name="log-in" [size]="20" />
          </bb-button>
        </div>
      } @else {
        <form novalidate [attr.aria-busy]="submitting()" (submit)="onSubmit($event)">
          @if (failure(); as key) {
            <p #alert class="bb-alert" role="alert" tabindex="-1">
              <bb-icon name="circle-alert" [size]="20" />
              {{ i18n.t(key) }}
            </p>
          }

          <div class="row">
            <bb-text-field
              [formField]="signUpForm.firstName"
              autocomplete="given-name"
              [label]="i18n.t('first_name')"
              [placeholder]="i18n.t('first_name_placeholder')"
              [error]="errorOf(signUpForm.firstName)"
            />
            <bb-text-field
              [formField]="signUpForm.lastName"
              autocomplete="family-name"
              [label]="i18n.t('last_name')"
              [placeholder]="i18n.t('last_name_placeholder')"
              [error]="errorOf(signUpForm.lastName)"
            />
          </div>

          <div class="with-action">
            <bb-text-field
              [formField]="signUpForm.email"
              type="email"
              autocomplete="username"
              [label]="i18n.t('email')"
              [placeholder]="i18n.t('email_placeholder')"
              [error]="errorOf(signUpForm.email)"
            />
            @if (emailTaken()) {
              <a
                class="bb-highlight"
                routerLink="/signin"
                [queryParams]="{ email: model().email.trim() }"
                >{{ i18n.t('sign_in_with_this_email') }}</a
              >
            }
          </div>

          <bb-text-field
            [formField]="signUpForm.password"
            type="password"
            autocomplete="new-password"
            [revealable]="true"
            [label]="i18n.t('password')"
            [placeholder]="i18n.t('password_placeholder')"
            [hint]="i18n.t('password_hint')"
            [error]="errorOf(signUpForm.password)"
          />

          <bb-text-field
            [formField]="signUpForm.confirmPassword"
            type="password"
            autocomplete="new-password"
            [revealable]="true"
            [label]="i18n.t('confirm_password')"
            [placeholder]="i18n.t('confirm_password_placeholder')"
            [error]="errorOf(signUpForm.confirmPassword)"
          />

          <bb-button type="submit" [disabled]="submitting()">
            <bb-t [key]="buttonKey()" [reserve]="['sign_up', 'creating_account', 'signing_in']" />
            <bb-icon slot="right" name="user-plus" [size]="20" />
          </bb-button>
        </form>
      }

      <bb-t slot="switch" key="already_have_account" />
      <a slot="switch" class="bb-highlight" routerLink="/signin"><bb-t key="sign_in" /></a>
    </bb-auth-shell>
  `,
  styles: `
    form,
    .created {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .with-action {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .with-action bb-text-field {
      align-self: stretch;
    }

    .with-action a {
      font-size: var(--bb-fs-body-3);
    }

    form bb-button {
      margin-top: 8px;
    }

    .bb-alert p {
      margin: 0;
    }

    .notice-title {
      font-weight: 600;
    }
  `,
})
export class SignUpPage {
  protected readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  private readonly alert = viewChild<ElementRef<HTMLElement>>('alert');
  private readonly notice = viewChild<ElementRef<HTMLElement>>('notice');

  protected readonly step = signal<Step>('idle');
  protected readonly submitting = computed(() => this.step() !== 'idle');
  /** Echec general, affiche en tete de formulaire. */
  protected readonly failure = signal<TranslationKey | null>(null);
  /** Renseigne quand le compte existe mais que la connexion qui suit a echoue. */
  protected readonly createdEmail = signal<string | null>(null);

  protected readonly buttonKey = computed<TranslationKey>(() => {
    const step = this.step();
    if (step === 'creating') return 'creating_account';
    if (step === 'signing_in') return 'signing_in';
    return 'sign_up';
  });

  protected readonly model = signal<SignUpForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Messages en fonctions : ils sont relus a l'affichage et suivent la langue.
  protected readonly signUpForm = form(this.model, (path) => {
    // Saisie figee pendant l'envoi : ce qui part est ce qui est affiche.
    disabled(path, { when: () => this.submitting() });

    required(path.firstName, { message: () => this.i18n.t('error_first_name_required') });
    maxLength(path.firstName, NAME_MAX, { message: () => this.i18n.t('error_name_too_long') });
    required(path.lastName, { message: () => this.i18n.t('error_last_name_required') });
    maxLength(path.lastName, NAME_MAX, { message: () => this.i18n.t('error_name_too_long') });

    required(path.email, { message: () => this.i18n.t('error_email_required') });
    email(path.email, { message: () => this.i18n.t('error_email_invalid') });
    maxLength(path.email, EMAIL_MAX, { message: () => this.i18n.t('error_email_too_long') });

    required(path.password, { message: () => this.i18n.t('error_password_required') });
    // Meme regle que la politique du realm : l'annoncer ici evite un aller-retour.
    minLength(path.password, PASSWORD_MIN, {
      message: () => this.i18n.t('error_password_too_short'),
    });
    maxLength(path.password, PASSWORD_MAX, {
      message: () => this.i18n.t('error_password_too_long'),
    });

    required(path.confirmPassword, {
      message: () => this.i18n.t('error_confirm_password_required'),
    });
    // Porte par la confirmation mais relu a chaque frappe dans le mot de passe :
    // corriger l'un ou l'autre efface l'erreur.
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() && value() !== valueOf(path.password)
        ? { kind: 'password_mismatch', message: this.i18n.t('error_password_mismatch') }
        : null,
    );
  });

  protected readonly emailTaken = computed(() =>
    this.signUpForm
      .email()
      .errors()
      .some((error) => error.kind === 'email_already_used'),
  );

  constructor() {
    if (this.auth.isSignedIn()) {
      void this.router.navigate(['/home']);
    }
  }

  protected errorOf(field: FieldTree<unknown>): string | null {
    const state = field();
    if (!state.touched()) return null;
    const error = state.errors()[0];
    if (!error) return null;
    const serverKey = SERVER_FIELD_ERRORS[error.kind];
    return serverKey ? this.i18n.t(serverKey) : (error.message ?? null);
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.submitting()) return;
    this.failure.set(null);
    await submit(this.signUpForm, {
      action: () => this.register(),
      onInvalid: () => this.focusFirstInvalid(),
    });
  }

  protected goToSignIn(address: string): void {
    void this.router.navigate(['/signin'], { queryParams: { email: address } });
  }

  private async register(): Promise<ValidationError.WithOptionalFieldTree[] | undefined> {
    const values = this.model();
    const address = values.email.trim();
    try {
      this.step.set('creating');
      try {
        await firstValueFrom(
          this.users.register({
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: address,
            password: values.password,
          }),
        );
      } catch (cause) {
        return this.registrationErrors(cause);
      }

      // Le compte existe : on enchaine sur une connexion normale plutot que de
      // renvoyer l'utilisateur vers un formulaire qu'il vient de remplir.
      this.step.set('signing_in');
      try {
        await this.auth.signIn(address, values.password);
      } catch {
        this.createdEmail.set(address);
        this.afterRender(() => this.notice()?.nativeElement.focus());
        return undefined;
      }
      await this.router.navigate(['/home']);
      return undefined;
    } finally {
      this.step.set('idle');
    }
  }

  /**
   * userservice renvoie un `code` stable dans `errors[0].extensions.code` : les
   * deux qui designent un champ y sont rattaches, le reste est un echec general.
   */
  private registrationErrors(cause: unknown): ValidationError.WithOptionalFieldTree[] | undefined {
    const code = cause instanceof GraphQlError ? cause.code : undefined;
    const field =
      code === 'email_already_used'
        ? this.signUpForm.email
        : code === 'password_rejected'
          ? this.signUpForm.password
          : undefined;
    if (code && field) {
      this.afterRender(() => field().focusBoundControl());
      // Pas de `message` : errorOf() le retraduit a partir du code.
      return [{ fieldTree: field, kind: code }];
    }
    this.failure.set(this.failureKey(cause));
    this.afterRender(() => this.alert()?.nativeElement.focus());
    return undefined;
  }

  private failureKey(cause: unknown): TranslationKey {
    const key = loadErrorKey(cause);
    if (key === 'load_error_offline') return key;
    if (key === 'load_error_unavailable') return 'error_sign_up_unavailable';
    // Sans code, un BAD_REQUEST vient de la validation du schema : une valeur a
    // passe nos regles mais pas celles du serveur.
    if (cause instanceof GraphQlError && cause.classification === 'BAD_REQUEST') {
      return 'error_sign_up_rejected';
    }
    return 'error_sign_up_failed';
  }

  /** Premier champ en erreur, dans l'ordre de lecture. */
  private focusFirstInvalid(): void {
    const { firstName, lastName, email, password, confirmPassword } = this.signUpForm;
    [firstName, lastName, email, password, confirmPassword]
      .find((field) => field().invalid())?.()
      .focusBoundControl();
  }

  /** Le champ ou le message n'est focusable qu'une fois rendu et reactive. */
  private afterRender(action: () => void): void {
    afterNextRender(action, { injector: this.injector });
  }
}
