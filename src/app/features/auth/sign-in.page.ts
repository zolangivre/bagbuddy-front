import { Component, inject, signal } from '@angular/core';
import { email, FieldTree, form, FormField, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { TextField } from '../../shared/ui/text-field';
import { messageForAuthError } from './auth-messages';
import { AuthShell } from './auth-shell';

interface Credentials {
  email: string;
  password: string;
}

/**
 * Connexion. Le mobile ouvre le navigateur sur la page de Keycloak ; ici le
 * formulaire est a nous et echange directement les identifiants contre des
 * jetons (voir AuthService).
 */
@Component({
  selector: 'bb-sign-in-page',
  imports: [RouterLink, FormField, AuthShell, TextField, Button, Icon],
  template: `
    <bb-auth-shell [title]="i18n.t('sign_in_title')" [lede]="i18n.t('sign_in_lede')">
      <form (submit)="submit($event)">
        @if (failure(); as message) {
          <p class="alert" role="alert">
            <bb-icon name="circle-alert" [size]="20" />
            {{ message }}
          </p>
        }

        <bb-text-field
          [formField]="credentials.email"
          type="email"
          autocomplete="username"
          [label]="i18n.t('email')"
          [placeholder]="i18n.t('email_placeholder')"
          [error]="errorOf(credentials.email)"
        />

        <bb-text-field
          [formField]="credentials.password"
          type="password"
          autocomplete="current-password"
          [revealable]="true"
          [label]="i18n.t('password')"
          [placeholder]="i18n.t('password_placeholder')"
          [error]="errorOf(credentials.password)"
        />

        <bb-button
          type="submit"
          [text]="submitting() ? i18n.t('signing_in') : i18n.t('sign_in')"
          [disabled]="submitting()"
        >
          <bb-icon slot="right" name="log-in" [size]="20" />
        </bb-button>
      </form>

      <span slot="switch">
        {{ i18n.t('no_account_yet') }}
        <a class="bb-highlight" routerLink="/signup">{{ i18n.t('sign_up') }}</a>
      </span>
    </bb-auth-shell>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
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
export class SignInPage {
  protected readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly failure = signal<string | null>(null);

  protected readonly model = signal<Credentials>({ email: '', password: '' });
  protected readonly credentials = form(this.model, (path) => {
    required(path.email, { message: this.i18n.t('error_email_required') });
    email(path.email, { message: this.i18n.t('error_email_invalid') });
    required(path.password, { message: this.i18n.t('error_password_required') });
  });

  constructor() {
    if (this.auth.isSignedIn()) {
      void this.router.navigateByUrl(this.returnUrl());
    }
  }

  protected errorOf(field: FieldTree<unknown>): string | null {
    const state = field();
    if (!state.touched()) return null;
    return state.errors()[0]?.message ?? null;
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    const state = this.credentials();
    state.markAsTouched();
    if (!state.valid() || this.submitting()) return;

    this.failure.set(null);
    this.submitting.set(true);
    try {
      const values = this.model();
      await this.auth.signIn(values.email.trim(), values.password);
      await this.router.navigateByUrl(this.returnUrl());
    } catch (cause) {
      this.failure.set(messageForAuthError(this.i18n, cause));
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * D'ou l'utilisateur a ete renvoye ici. On n'accepte qu'un chemin interne :
   * un `returnUrl` absolu ferait de cet ecran une redirection ouverte.
   */
  private returnUrl(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    return requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/home';
  }
}
