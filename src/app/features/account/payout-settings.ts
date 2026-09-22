import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { loadErrorKeyOr } from '../../core/api/load-error';
import { PayoutAccountStatus, StripeService } from '../../core/api/stripe.service';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { T } from '../../shared/ui/t';

/**
 * Versements du voyageur : ou en est son compte Stripe Connect, et le bouton
 * qui l'y envoie.
 *
 * L'onboarding se fait chez Stripe (identite, IBAN) : c'est la seule sortie du
 * site assumee, parce que ces donnees ne doivent pas transiter par nous. Le
 * lien est demande au clic et ouvert aussitot, jamais stocke. Stripe revient
 * sur `/account?payouts=done` ou `?payouts=retry` (lien expire) ; le parametre
 * est lu une fois puis retire de l'adresse.
 */
@Component({
  selector: 'bb-payout-settings',
  imports: [Icon, Button, T],
  template: `
    <section id="payouts" class="bb-card">
      <h2 class="bb-card-title">
        <bb-icon name="banknote" [size]="20" />
        {{ i18n.t('payouts_title') }}
      </h2>
      <p class="bb-body-3 sub">{{ i18n.t('payouts_lede') }}</p>

      @if (returned(); as key) {
        <p
          class="bb-alert"
          [class.bb-alert--success]="key === 'payouts_returned_done'"
          role="status"
        >
          <bb-icon
            [name]="key === 'payouts_returned_done' ? 'circle-check' : 'circle-alert'"
            [size]="20"
          />
          {{ i18n.t(key) }}
        </p>
      }

      @if (loading()) {
        <p class="bb-body-2 line">{{ i18n.t('loading') }}</p>
      } @else if (unavailable(); as key) {
        <p class="bb-body-2 line">{{ i18n.t(key) }}</p>
      } @else {
        <p class="bb-body-2 line state">
          <bb-icon [name]="stateIcon()" [size]="18" />
          {{ i18n.t(stateKey()) }}
        </p>
        @if (!account()?.transfersActive) {
          <bb-button [disabled]="redirecting()" (pressed)="startOnboarding()">
            <bb-t
              [key]="
                redirecting()
                  ? 'payouts_redirecting'
                  : account()?.connected
                    ? 'payouts_continue'
                    : 'payouts_setup'
              "
              [reserve]="['payouts_redirecting', 'payouts_continue', 'payouts_setup']"
            />
            <bb-icon slot="right" name="arrow-right" [size]="20" />
          </bb-button>
        }
      }

      @if (failure(); as key) {
        <p class="bb-alert" role="alert">
          <bb-icon name="circle-alert" [size]="20" />
          {{ i18n.t(key) }}
        </p>
      }
    </section>
  `,
  styles: `
    .bb-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: var(--bb-primary);
    }

    .sub,
    .line {
      margin: 0;
    }

    .state {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--bb-title);
    }

    bb-button {
      width: auto;
      align-self: flex-start;
      white-space: nowrap;
    }

    .bb-alert {
      margin: 0;
    }
  `,
})
export class PayoutSettings {
  protected readonly i18n = inject(I18nService);
  private readonly stripe = inject(StripeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly account = signal<PayoutAccountStatus | null>(null);
  /** Rempli quand stripeservice n'a pas repondu : en dev, c'est l'etat attendu. */
  protected readonly unavailable = signal<TranslationKey | null>(null);
  protected readonly redirecting = signal(false);
  protected readonly failure = signal<TranslationKey | null>(null);
  protected readonly returned = signal<TranslationKey | null>(null);

  constructor() {
    const payouts = this.route.snapshot.queryParamMap.get('payouts');
    if (payouts === 'done') this.returned.set('payouts_returned_done');
    if (payouts === 'retry') this.returned.set('payouts_returned_retry');
    if (payouts) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { payouts: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    this.load();
  }

  protected stateKey(): TranslationKey {
    const account = this.account();
    if (!account?.connected) return 'payouts_state_none';
    if (account.transfersActive) return 'payouts_state_active';
    if (account.detailsSubmitted) return 'payouts_state_review';
    return 'payouts_state_incomplete';
  }

  protected stateIcon(): 'circle-check' | 'clock' | 'circle-alert' {
    const account = this.account();
    if (account?.transfersActive) return 'circle-check';
    if (account?.detailsSubmitted) return 'clock';
    return 'circle-alert';
  }

  protected async startOnboarding(): Promise<void> {
    if (this.redirecting()) return;
    this.redirecting.set(true);
    this.failure.set(null);
    try {
      const url = await firstValueFrom(this.stripe.startPayoutOnboarding());
      window.location.assign(url);
    } catch (cause) {
      this.failure.set(loadErrorKeyOr(cause, 'payouts_onboarding_failed'));
      this.redirecting.set(false);
    }
  }

  private load(): void {
    this.stripe.payoutAccount().subscribe({
      next: (account) => {
        this.account.set(account);
        this.loading.set(false);
      },
      // stripe-service ne demarre pas sans cles Stripe : en dev, c'est l'etat attendu.
      error: (cause) => {
        this.unavailable.set(loadErrorKeyOr(cause, 'payouts_unavailable'));
        this.loading.set(false);
      },
    });
  }
}
