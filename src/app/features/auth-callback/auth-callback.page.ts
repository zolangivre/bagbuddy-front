import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Button } from '../../shared/ui/button';
import { Loader } from '../../shared/ui/loader';

/** Retour de Keycloak : echange le code contre les tokens puis redirige. */
@Component({
  selector: 'bb-auth-callback-page',
  imports: [Loader, Button],
  template: `
    <div class="screen">
      @if (error()) {
        <p class="bb-body">{{ error() }}</p>
        <bb-button [text]="i18n.t('start_button')" (pressed)="retry()" />
      } @else {
        <bb-loader [label]="i18n.t('loading')" />
      }
    </div>
  `,
  styles: `
    .screen {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px;
      max-width: 420px;
      margin: 0 auto;
      text-align: center;
    }
  `,
})
export class AuthCallbackPage {
  protected readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly error = signal<string | null>(null);

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const code = params.get('code');
    const authError = params.get('error_description') ?? params.get('error');

    if (authError) {
      this.error.set(authError);
    } else if (!code) {
      void this.router.navigate(['/start']);
    } else {
      this.auth
        .handleCallback(code)
        .then((returnUrl) => this.router.navigateByUrl(returnUrl))
        .catch((cause: unknown) => this.error.set(String(cause)));
    }
  }

  protected retry(): void {
    void this.router.navigate(['/start']);
  }
}
