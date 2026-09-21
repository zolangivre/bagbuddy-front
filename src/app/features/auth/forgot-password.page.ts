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
  maxLength,
  required,
  submit,
} from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { loadErrorKeyOr } from '../../core/api/load-error';
import { UsersService } from '../../core/api/users.service';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { T } from '../../shared/ui/t';
import { TextField } from '../../shared/ui/text-field';
import { AuthShell } from './auth-shell';

/** Meme borne que RequestPasswordResetRequest cote userservice. */
const EMAIL_MAX = 255;

/**
 * Mot de passe oublie, premiere moitie : demander le lien.
 *
 * userservice repond `true` que l'email corresponde a un compte ou non, pour ne
 * pas dire qui est inscrit. L'ecran s'y tient : il annonce toujours un envoi
 * « si un compte utilise cet email », et ne propose jamais « aucun compte ».
 * Seuls le reseau ou un service en panne produisent un echec.
 *
 * Le lien est redige dans la langue affichee au moment de la demande.
 */
@Component({
  selector: 'bb-forgot-password-page',
  imports: [T, RouterLink, FormField, AuthShell, TextField, Button, Icon],
  template: `
    <bb-auth-shell titleKey="forgot_password_title" ledeKey="forgot_password_lede">
      @if (sentTo(); as address) {
        <div class="sent">
          <div #notice class="bb-alert bb-alert--success" role="status" tabindex="-1">
            <bb-icon name="circle-check" [size]="20" />
            <div>
              <p class="notice-title">{{ i18n.t('reset_link_sent_title') }}</p>
              <p>{{ i18n.t('reset_link_sent_message', { email: address }) }}</p>
            </div>
          </div>
          <button type="button" class="bb-highlight retry" (click)="startOver()">
            {{ i18n.t('use_another_email') }}
          </button>
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
            [formField]="request.email"
            type="email"
            autocomplete="username"
            [label]="i18n.t('email')"
            [placeholder]="i18n.t('email_placeholder')"
            [error]="errorOf(request.email)"
          />

          <bb-button type="submit" [disabled]="submitting()">
            <bb-t
              [key]="submitting() ? 'sending_reset_link' : 'send_reset_link'"
              [reserve]="['sending_reset_link', 'send_reset_link']"
            />
            <bb-icon slot="right" name="send" [size]="20" />
          </bb-button>
        </form>
      }

      <a
        slot="switch"
        class="bb-highlight"
        routerLink="/signin"
        [queryParams]="{ email: model().email.trim() || null }"
      >
        <bb-t key="back_to_sign_in" />
      </a>
    </bb-auth-shell>
  `,
  styles: `
    form,
    .sent {
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

    .retry {
      align-self: flex-start;
      padding: 0;
      border: 0;
      background: none;
      font: inherit;
      font-size: var(--bb-fs-body-2);
      color: var(--bb-primary);
      cursor: pointer;
    }
  `,
})
export class ForgotPasswordPage {
  protected readonly i18n = inject(I18nService);
  private readonly users = inject(UsersService);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);

  private readonly alert = viewChild<ElementRef<HTMLElement>>('alert');
  private readonly notice = viewChild<ElementRef<HTMLElement>>('notice');

  protected readonly submitting = signal(false);
  protected readonly failure = signal<TranslationKey | null>(null);
  /** Adresse a laquelle le lien a ete demande : l'ecran passe alors a la confirmation. */
  protected readonly sentTo = signal<string | null>(null);

  /** La connexion transmet l'email deja saisi : pas besoin de le retaper. */
  protected readonly model = signal({
    email: this.route.snapshot.queryParamMap.get('email')?.trim() ?? '',
  });

  protected readonly request = form(this.model, (path) => {
    disabled(path, { when: () => this.submitting() });
    required(path.email, { message: () => this.i18n.t('error_email_required') });
    email(path.email, { message: () => this.i18n.t('error_email_invalid') });
    maxLength(path.email, EMAIL_MAX, { message: () => this.i18n.t('error_email_too_long') });
  });

  protected errorOf(field: FieldTree<unknown>): string | null {
    const state = field();
    if (!state.touched()) return null;
    return state.errors()[0]?.message ?? null;
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.submitting()) return;
    this.failure.set(null);
    await submit(this.request, {
      action: () => this.send(),
      onInvalid: () => this.request.email().focusBoundControl(),
    });
  }

  /** Retour au formulaire, email conserve : c'est souvent une faute de frappe. */
  protected startOver(): void {
    this.sentTo.set(null);
    this.request().reset();
    this.afterRender(() => this.request.email().focusBoundControl());
  }

  private async send(): Promise<undefined> {
    const address = this.model().email.trim();
    this.submitting.set(true);
    try {
      await firstValueFrom(this.users.requestPasswordReset(address, this.i18n.language()));
      this.sentTo.set(address);
      this.afterRender(() => this.notice()?.nativeElement.focus());
    } catch (cause) {
      this.failure.set(loadErrorKeyOr(cause, 'error_reset_request_failed'));
      this.afterRender(() => this.alert()?.nativeElement.focus());
    } finally {
      this.submitting.set(false);
    }
    return undefined;
  }

  private afterRender(action: () => void): void {
    afterNextRender(action, { injector: this.injector });
  }
}
