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
  email,
  FieldTree,
  form,
  FormField,
  required,
  submit,
} from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { TextField } from '../../shared/ui/text-field';
import { messageForAuthError } from './auth-messages';
import { T } from '../../shared/ui/t';
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
  imports: [T, RouterLink, FormField, AuthShell, TextField, Button, Icon],
  template: `
    <bb-auth-shell titleKey="sign_in_title" ledeKey="sign_in_lede">
      <form novalidate [attr.aria-busy]="submitting()" (submit)="onSubmit($event)">
        @if (failure(); as message) {
          <p #alert class="bb-alert" role="alert" tabindex="-1">
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

        <bb-button type="submit" [disabled]="submitting()">
          <bb-t
            [key]="submitting() ? 'signing_in' : 'sign_in'"
            [reserve]="['signing_in', 'sign_in']"
          />
          <bb-icon slot="right" name="log-in" [size]="20" />
        </bb-button>
      </form>

      <bb-t slot="switch" key="no_account_yet" />
      <a slot="switch" class="bb-highlight" routerLink="/signup"><bb-t key="sign_up" /></a>
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
  `,
})
export class SignInPage {
  protected readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly alert = viewChild<ElementRef<HTMLElement>>('alert');

  protected readonly submitting = signal(false);
  protected readonly failure = signal<string | null>(null);

  /**
   * L'inscription renvoie ici avec `?email=` quand le compte est cree mais que
   * la connexion automatique a echoue, ou quand l'email est deja pris : il ne
   * reste que le mot de passe a saisir.
   */
  protected readonly model = signal<Credentials>({
    email: this.route.snapshot.queryParamMap.get('email')?.trim() ?? '',
    password: '',
  });
  protected readonly credentials = form(this.model, (path) => {
    disabled(path, { when: () => this.submitting() });
    required(path.email, { message: () => this.i18n.t('error_email_required') });
    email(path.email, { message: () => this.i18n.t('error_email_invalid') });
    required(path.password, { message: () => this.i18n.t('error_password_required') });
  });

  constructor() {
    if (this.auth.isSignedIn()) {
      void this.router.navigateByUrl(this.returnUrl());
      return;
    }
    if (this.model().email) {
      afterNextRender(() => this.credentials.password().focusBoundControl());
    }
  }

  protected errorOf(field: FieldTree<unknown>): string | null {
    const state = field();
    if (!state.touched()) return null;
    return state.errors()[0]?.message ?? null;
  }

  /** Meme schema que l'inscription : `submit()` touche les champs et valide. */
  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.submitting()) return;
    this.failure.set(null);
    await submit(this.credentials, {
      action: () => this.signIn(),
      onInvalid: () => {
        const { email, password } = this.credentials;
        [email, password]
          .find((field) => field().invalid())?.()
          .focusBoundControl();
      },
    });
  }

  private async signIn(): Promise<undefined> {
    this.submitting.set(true);
    try {
      const values = this.model();
      await this.auth.signIn(values.email.trim(), values.password);
      await this.router.navigateByUrl(this.returnUrl());
    } catch (cause) {
      this.failure.set(messageForAuthError(this.i18n, cause));
      afterNextRender(() => this.alert()?.nativeElement.focus(), { injector: this.injector });
    } finally {
      this.submitting.set(false);
    }
    return undefined;
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
