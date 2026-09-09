import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { email, FieldTree, form, FormField, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../../core/api/users.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { TextField } from '../../shared/ui/text-field';
import { messageForAuthError } from './auth-messages';
import { AuthShell } from './auth-shell';

interface SignUpForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Inscription. Le realm Keycloak n'ouvre pas sa propre page d'inscription :
 * c'est userservice qui cree le compte (POST /users/register), puis on
 * enchaine sur une connexion normale — l'utilisateur ne voit qu'un formulaire.
 */
@Component({
  selector: 'bb-sign-up-page',
  imports: [RouterLink, FormField, AuthShell, TextField, Button, Icon],
  template: `
    <bb-auth-shell [title]="i18n.t('sign_up_title')" [lede]="i18n.t('sign_up_lede')">
      <form (submit)="submit($event)">
        @if (failure(); as message) {
          <p class="alert" role="alert">
            <bb-icon name="circle-alert" [size]="20" />
            {{ message }}
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

        <bb-text-field
          [formField]="signUpForm.email"
          type="email"
          autocomplete="username"
          [label]="i18n.t('email')"
          [placeholder]="i18n.t('email_placeholder')"
          [error]="errorOf(signUpForm.email)"
        />

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

        <bb-button
          type="submit"
          [text]="submitting() ? i18n.t('creating_account') : i18n.t('sign_up')"
          [disabled]="submitting()"
        >
          <bb-icon slot="right" name="user-plus" [size]="20" />
        </bb-button>
      </form>

      <span slot="switch">
        {{ i18n.t('already_have_account') }}
        <a class="bb-highlight" routerLink="/signin">{{ i18n.t('sign_in') }}</a>
      </span>
    </bb-auth-shell>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    form bb-button {
      margin-top: 8px;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      padding: 12px 14px;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-red-a10);
      color: var(--bb-error);
      font-size: var(--bb-fs-body-2);
    }

    .alert bb-icon {
      flex: none;
    }
  `,
})
export class SignUpPage {
  protected readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly failure = signal<string | null>(null);

  protected readonly model = signal<SignUpForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  protected readonly signUpForm = form(this.model, (path) => {
    required(path.firstName, { message: this.i18n.t('error_first_name_required') });
    required(path.lastName, { message: this.i18n.t('error_last_name_required') });
    required(path.email, { message: this.i18n.t('error_email_required') });
    email(path.email, { message: this.i18n.t('error_email_invalid') });
    required(path.password, { message: this.i18n.t('error_password_required') });
    // Meme regle que la politique du realm : l'annoncer ici evite un aller-retour.
    minLength(path.password, 8, { message: this.i18n.t('error_password_too_short') });
  });

  constructor() {
    if (this.auth.isSignedIn()) {
      void this.router.navigate(['/home']);
    }
  }

  protected errorOf(field: FieldTree<unknown>): string | null {
    const state = field();
    if (!state.touched()) return null;
    return state.errors()[0]?.message ?? null;
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    const state = this.signUpForm();
    state.markAsTouched();
    if (!state.valid() || this.submitting()) return;

    const values = this.model();
    const address = values.email.trim();

    this.failure.set(null);
    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.users.register({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: address,
          password: values.password,
        }),
      );
      // Le compte existe : on enchaine sur une connexion normale plutot que de
      // renvoyer l'utilisateur vers un formulaire qu'il vient de remplir.
      await this.auth.signIn(address, values.password);
      await this.router.navigate(['/home']);
    } catch (cause) {
      this.failure.set(this.messageFor(cause));
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * userservice renvoie un `code` stable dans le ProblemDetail ; au-dela, l'echec
   * vient de la connexion qui suit la creation.
   */
  private messageFor(cause: unknown): string {
    if (cause instanceof HttpErrorResponse) {
      const code = (cause.error as { code?: string } | null)?.code;
      if (code === 'email_already_used') return this.i18n.t('error_email_already_used');
      if (code === 'password_rejected') return this.i18n.t('error_password_rejected');
      return this.i18n.t('error_auth_unavailable');
    }
    return messageForAuthError(this.i18n, cause);
  }
}
