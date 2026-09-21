import { Component, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GraphQlError } from '../../core/api/graphql.client';
import { loadErrorKeyOr } from '../../core/api/load-error';
import { UsersService } from '../../core/api/users.service';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { T } from '../../shared/ui/t';

type SendState = 'idle' | 'sent' | 'failed';

/**
 * Bandeau de l'ecran de compte tant que l'adresse n'est pas verifiee : il dit
 * pourquoi la verifier et envoie le lien.
 *
 * Teinte ambre et non rouge : rien n'est casse, il reste une etape. Le texte
 * d'etat est dans une region `aria-live`, pour qu'un lecteur d'ecran entende
 * « lien envoye » sans que le focus quitte le bouton.
 *
 * Quand le back repond `false`, l'adresse etait deja verifiee (confirmee
 * depuis un autre appareil) : `verified` previent l'ecran, qui recharge
 * l'identite et fait disparaitre le bandeau.
 */
@Component({
  selector: 'bb-email-verification-notice',
  imports: [Icon, Button, T],
  template: `
    <div class="notice">
      <bb-icon name="shield" [size]="20" />
      <div class="body">
        <p class="title">{{ i18n.t('email_not_verified_title') }}</p>
        <p class="status" aria-live="polite">
          @switch (state()) {
            @case ('sent') {
              {{ i18n.t('verification_link_sent', { email: email() }) }}
            }
            @case ('failed') {
              <span class="error">{{ i18n.t(failure()) }}</span>
            }
            @default {
              {{ i18n.t('email_not_verified_message', { email: email() }) }}
            }
          }
        </p>
        <bb-button tone="warning" [disabled]="sending() || state() === 'sent'" (pressed)="send()">
          <bb-t
            [key]="sending() ? 'sending_reset_link' : 'send_verification_link'"
            [reserve]="['sending_reset_link', 'send_verification_link']"
          />
          <bb-icon slot="right" name="send" [size]="18" />
        </bb-button>
      </div>
    </div>
  `,
  styles: `
    .notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-yellow-a10);
      color: var(--bb-title);
    }

    .notice > bb-icon {
      flex: none;
      margin-top: 1px;
      color: var(--bb-warning);
    }

    .body {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      min-width: 0;
    }

    p {
      margin: 0;
      font-size: var(--bb-fs-body-2);
    }

    .title {
      font-weight: 600;
    }

    .error {
      color: var(--bb-error);
    }

    bb-button {
      width: auto;
      margin-top: 6px;
      white-space: nowrap;
    }
  `,
})
export class EmailVerificationNotice {
  protected readonly i18n = inject(I18nService);
  private readonly users = inject(UsersService);

  readonly email = input.required<string>();
  /** L'adresse s'est revelee deja verifiee : a l'ecran de recharger l'identite. */
  readonly verified = output<void>();

  protected readonly sending = signal(false);
  protected readonly state = signal<SendState>('idle');
  /** Message du dernier echec ; lu seulement en etat « failed ». */
  protected readonly failure = signal<TranslationKey>('error_verification_send_failed');

  protected async send(): Promise<void> {
    if (this.sending()) return;
    this.sending.set(true);
    try {
      const sent = await firstValueFrom(this.users.sendVerificationEmail(this.i18n.language()));
      if (sent) {
        this.state.set('sent');
      } else {
        this.verified.emit();
      }
    } catch (cause) {
      this.failure.set(this.keyFor(cause));
      this.state.set('failed');
    } finally {
      this.sending.set(false);
    }
  }

  private keyFor(cause: unknown): TranslationKey {
    if (cause instanceof GraphQlError && cause.code === 'verification_email_throttled') {
      return 'error_verification_throttled';
    }
    return loadErrorKeyOr(cause, 'error_verification_send_failed');
  }
}
