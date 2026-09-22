import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GraphQlError } from '../../core/api/graphql.client';
import { loadErrorKeyOr } from '../../core/api/load-error';
import { UsersService } from '../../core/api/users.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { Loader } from '../../shared/ui/loader';
import { T } from '../../shared/ui/t';
import { AuthShell } from './auth-shell';
import { readFragmentToken } from './fragment-token';

type VerifyState =
  | { kind: 'verifying' }
  | { kind: 'verified' }
  | { kind: 'invalid' }
  | { kind: 'failed'; key: TranslationKey };

/**
 * L'ecran ouvert par le lien de verification, `/verify-email#<jeton>`.
 *
 * Il confirme tout seul, sans bouton : le lien est deja le geste de
 * l'utilisateur. C'est sans risque parce que le jeton est dans le fragment et
 * que la confirmation est un POST lance par le script de la page — un
 * antivirus de messagerie qui « visite » le lien sans executer la page ne le
 * consomme pas.
 *
 * Il fonctionne connecte ou non (le lien s'ouvre souvent sur le telephone) ;
 * connecte, il rafraichit le jeton pour que le badge change tout de suite.
 */
@Component({
  selector: 'bb-verify-email-page',
  imports: [T, RouterLink, AuthShell, Button, Icon, Loader],
  template: `
    <bb-auth-shell titleKey="verify_email_title" ledeKey="verify_email_lede">
      @switch (state().kind) {
        @case ('verifying') {
          <bb-loader [size]="40" [label]="i18n.t('verifying_email')" />
        }
        @case ('verified') {
          <div class="outcome">
            <div #notice class="bb-alert bb-alert--success" role="status" tabindex="-1">
              <bb-icon name="circle-check" [size]="20" />
              <div>
                <p class="notice-title">{{ i18n.t('email_verified_title') }}</p>
                <p>{{ i18n.t('email_verified_message') }}</p>
              </div>
            </div>
            <bb-button (pressed)="continue()">
              <bb-t [key]="auth.isSignedIn() ? 'continue' : 'sign_in'" />
              <bb-icon slot="right" name="arrow-right" [size]="20" />
            </bb-button>
          </div>
        }
        @case ('invalid') {
          <div class="outcome">
            <div #notice class="bb-alert" role="alert" tabindex="-1">
              <bb-icon name="circle-alert" [size]="20" />
              <div>
                <p class="notice-title">{{ i18n.t('verification_link_invalid_title') }}</p>
                <p>{{ i18n.t('verification_link_invalid_message') }}</p>
              </div>
            </div>
            <bb-button (pressed)="goToAccount()">
              <bb-t key="go_to_my_account" />
              <bb-icon slot="right" name="arrow-right" [size]="20" />
            </bb-button>
          </div>
        }
        @case ('failed') {
          <div class="outcome">
            <p #notice class="bb-alert" role="alert" tabindex="-1">
              <bb-icon name="circle-alert" [size]="20" />
              {{ i18n.t(failureKey()) }}
            </p>
            <bb-button (pressed)="verify()">
              <bb-t key="retry" />
            </bb-button>
          </div>
        }
      }

      @if (!auth.isSignedIn()) {
        <a slot="switch" class="bb-highlight" routerLink="/signin">
          <bb-t key="back_to_sign_in" />
        </a>
      }
    </bb-auth-shell>
  `,
  styles: `
    .outcome {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .bb-alert p {
      margin: 0;
    }

    .notice-title {
      font-weight: 600;
    }
  `,
})
export class VerifyEmailPage {
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly notice = viewChild<ElementRef<HTMLElement>>('notice');

  private token = '';
  protected readonly state = signal<VerifyState>({ kind: 'verifying' });

  constructor() {
    readFragmentToken(
      (token) => {
        this.token = token;
        void this.verify();
      },
      () => this.show({ kind: 'invalid' }),
    );
  }

  protected failureKey(): TranslationKey {
    const state = this.state();
    return state.kind === 'failed' ? state.key : 'error_verification_failed';
  }

  protected async verify(): Promise<void> {
    this.state.set({ kind: 'verifying' });
    try {
      await firstValueFrom(this.users.verifyEmail(this.token));
    } catch (cause) {
      if (cause instanceof GraphQlError && cause.code === 'invalid_verification_token') {
        this.show({ kind: 'invalid' });
      } else {
        this.show({
          kind: 'failed',
          key: loadErrorKeyOr(cause, 'error_verification_failed'),
        });
      }
      return;
    }

    // Le claim email_verified du jeton courant date d'avant : on en redemande un.
    if (this.auth.isSignedIn()) {
      try {
        await this.auth.refreshTokens();
        await this.auth.loadUserInfo();
      } catch {
        // L'adresse est verifiee quoi qu'il arrive ; le badge suivra au prochain chargement.
      }
    }
    this.show({ kind: 'verified' });
  }

  protected continue(): void {
    void this.router.navigate([this.auth.isSignedIn() ? '/profile' : '/signin']);
  }

  protected goToAccount(): void {
    void this.router.navigate(['/account']);
  }

  /** Le message recoit le focus : il remplace le chargement, rien d'autre n'est focusable. */
  private show(state: VerifyState): void {
    this.state.set(state);
    afterNextRender(() => this.notice()?.nativeElement.focus(), { injector: this.injector });
  }
}
