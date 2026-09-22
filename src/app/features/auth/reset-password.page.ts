import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import {
  disabled,
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
import { loadErrorKeyOr } from '../../core/api/load-error';
import { UsersService } from '../../core/api/users.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { T } from '../../shared/ui/t';
import { TextField } from '../../shared/ui/text-field';
import { AuthShell } from './auth-shell';
import { readFragmentToken } from './fragment-token';

interface ResetForm {
  newPassword: string;
  confirmPassword: string;
}

/** Memes bornes que l'inscription et ResetPasswordRequest cote userservice. */
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

/**
 * Mot de passe oublie, seconde moitie : l'ecran ouvert par le lien de l'email,
 * `/reset-password#<jeton>`.
 *
 * Le jeton est dans le fragment, qu'un navigateur n'envoie jamais au serveur :
 * il ne finit donc pas dans les journaux de l'hebergeur du front. Il est lu une
 * fois puis retire de la barre d'adresse, pour ne rester ni dans l'historique ni
 * dans une capture d'ecran.
 *
 * Un lien expire, deja utilise ou remplace par un plus recent ne laisse pas
 * remplir un formulaire pour rien : l'ecran le dit des le refus et renvoie vers
 * une nouvelle demande. Un mot de passe refuse par le realm, lui, ne coute pas
 * le lien (le back ne le brule qu'une fois le mot de passe accepte).
 */
@Component({
  selector: 'bb-reset-password-page',
  imports: [T, RouterLink, FormField, AuthShell, TextField, Button, Icon],
  template: `
    <bb-auth-shell titleKey="reset_password_title" ledeKey="reset_password_lede">
      @if (linkInvalid()) {
        <div class="invalid">
          <div #notice class="bb-alert" role="alert" tabindex="-1">
            <bb-icon name="circle-alert" [size]="20" />
            <div>
              <p class="notice-title">{{ i18n.t('reset_link_invalid_title') }}</p>
              <p>{{ i18n.t('reset_link_invalid_message') }}</p>
            </div>
          </div>
          <bb-button (pressed)="requestNewLink()">
            <bb-t key="request_new_link" />
            <bb-icon slot="right" name="send" [size]="20" />
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

          <bb-text-field
            [formField]="resetForm.newPassword"
            type="password"
            autocomplete="new-password"
            [revealable]="true"
            [label]="i18n.t('new_password')"
            [hint]="i18n.t('password_hint')"
            [error]="errorOf(resetForm.newPassword)"
          />

          <bb-text-field
            [formField]="resetForm.confirmPassword"
            type="password"
            autocomplete="new-password"
            [revealable]="true"
            [label]="i18n.t('confirm_new_password')"
            [error]="errorOf(resetForm.confirmPassword)"
          />

          <bb-button type="submit" [disabled]="submitting()">
            <bb-t
              [key]="submitting() ? 'saving' : 'set_new_password'"
              [reserve]="['saving', 'set_new_password']"
            />
            <bb-icon slot="right" name="lock" [size]="20" />
          </bb-button>
        </form>
      }

      <a slot="switch" class="bb-highlight" routerLink="/signin">
        <bb-t key="back_to_sign_in" />
      </a>
    </bb-auth-shell>
  `,
  styles: `
    form,
    .invalid {
      display: flex;
      flex-direction: column;
      gap: 16px;
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
export class ResetPasswordPage {
  protected readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  private readonly alert = viewChild<ElementRef<HTMLElement>>('alert');
  private readonly notice = viewChild<ElementRef<HTMLElement>>('notice');

  /** Retire de la barre d'adresse des sa lecture : il ne vit plus qu'ici. */
  private token = '';

  protected readonly submitting = signal(false);
  protected readonly failure = signal<TranslationKey | null>(null);
  /** Un lien sans jeton est traite comme un lien perime : meme issue, meme ecran. */
  protected readonly linkInvalid = signal(false);

  protected readonly model = signal<ResetForm>({ newPassword: '', confirmPassword: '' });

  protected readonly resetForm = form(this.model, (path) => {
    disabled(path, { when: () => this.submitting() });

    required(path.newPassword, { message: () => this.i18n.t('error_password_required') });
    minLength(path.newPassword, PASSWORD_MIN, {
      message: () => this.i18n.t('error_password_too_short'),
    });
    maxLength(path.newPassword, PASSWORD_MAX, {
      message: () => this.i18n.t('error_password_too_long'),
    });

    required(path.confirmPassword, {
      message: () => this.i18n.t('error_confirm_password_required'),
    });
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() && value() !== valueOf(path.newPassword)
        ? { kind: 'password_mismatch', message: this.i18n.t('error_password_mismatch') }
        : null,
    );
  });

  constructor() {
    readFragmentToken(
      (token) => {
        this.token = token;
        this.linkInvalid.set(false);
        this.failure.set(null);
      },
      () => this.linkInvalid.set(true),
    );
  }

  protected errorOf(field: FieldTree<unknown>): string | null {
    const state = field();
    if (!state.touched()) return null;
    const error = state.errors()[0];
    if (!error) return null;
    // Erreur renvoyee par le serveur : sans message, retraduite a l'affichage.
    if (error.kind === 'password_rejected') return this.i18n.t('error_password_rejected');
    return error.message ?? null;
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.submitting()) return;
    this.failure.set(null);
    await submit(this.resetForm, {
      action: () => this.reset(),
      onInvalid: () => {
        const { newPassword, confirmPassword } = this.resetForm;
        [newPassword, confirmPassword]
          .find((field) => field().invalid())?.()
          .focusBoundControl();
      },
    });
  }

  protected requestNewLink(): void {
    void this.router.navigate(['/forgot-password']);
  }

  private async reset(): Promise<ValidationError.WithOptionalFieldTree[] | undefined> {
    this.submitting.set(true);
    try {
      await firstValueFrom(this.users.resetPassword(this.token, this.model().newPassword));
    } catch (cause) {
      return this.resetErrors(cause);
    } finally {
      this.submitting.set(false);
    }

    // Le back a ferme toutes les sessions du compte. Une session ouverte dans ce
    // navigateur, quel que soit son compte, n'a plus de raison d'y rester.
    if (this.auth.isSignedIn()) {
      await this.auth.signOut();
    }
    await this.router.navigate(['/signin'], { queryParams: { reset: 1 } });
    return undefined;
  }

  private resetErrors(cause: unknown): ValidationError.WithOptionalFieldTree[] | undefined {
    const code = cause instanceof GraphQlError ? cause.code : undefined;
    if (code === 'invalid_reset_token') {
      this.linkInvalid.set(true);
      this.afterRender(() => this.notice()?.nativeElement.focus());
      return undefined;
    }
    if (code === 'password_rejected') {
      const field = this.resetForm.newPassword;
      this.afterRender(() => field().focusBoundControl());
      return [{ fieldTree: field, kind: code }];
    }
    this.failure.set(loadErrorKeyOr(cause, 'error_reset_failed'));
    this.afterRender(() => this.alert()?.nativeElement.focus());
    return undefined;
  }

  private afterRender(action: () => void): void {
    afterNextRender(action, { injector: this.injector });
  }
}
