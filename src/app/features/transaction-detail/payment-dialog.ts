import {
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { StripeService } from '../../core/api/stripe.service';
import { TransactionsService } from '../../core/api/transactions.service';
import { CurrencyService } from '../../core/currency.service';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Transaction } from '../../core/models';
import { loadStripe, StripeClient, StripeElement, StripeElements } from '../../core/stripe-js';
import { TRANSACTION_STATUS } from '../../core/transaction-status';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { Modal } from '../../shared/ui/modal';
import { T } from '../../shared/ui/t';

/** Le webhook Stripe arrive en general en quelques secondes ; au-dela on laisse la main. */
const WEBHOOK_WAIT_MS = 60_000;
const WEBHOOK_POLL_MS = 2_000;

type Step = 'preparing' | 'ready' | 'paying' | 'waiting' | 'late';

/**
 * Paiement reel d'une reservation acceptee, avec le Payment Element de Stripe.
 *
 * Le montant ne vient jamais d'ici : stripeservice cree le PaymentIntent a
 * partir du total stocke. La carte est saisie dans l'iframe de Stripe et ne
 * touche pas notre code.
 *
 * Paye ne veut pas encore dire confirme : c'est le webhook signe qui pose
 * `paidAt` cote back, et le passage a `confirmed` est refuse avant. L'ecran
 * relit donc la transaction jusqu'a voir `paidAt`, puis demande la
 * confirmation. Si le webhook tarde, il le dit et propose de reessayer, sans
 * jamais repayer : le PaymentIntent est deja reussi.
 */
@Component({
  selector: 'bb-payment-dialog',
  imports: [Modal, Button, Icon, T],
  template: `
    <bb-modal
      [open]="open()"
      [title]="i18n.t('complete_payment')"
      [closeLabel]="i18n.t('close')"
      (closed)="close()"
    >
      <p class="bb-body amount">
        {{ i18n.t('payment_amount') }}
        <strong class="bb-amount">{{ currency.format(transaction().total) }}</strong>
      </p>

      @if (failure(); as key) {
        <p class="bb-alert" role="alert">
          <bb-icon name="circle-alert" [size]="20" />
          {{ stripeMessage() ?? i18n.t(key) }}
        </p>
      }

      <div #mount class="element" [hidden]="step() === 'waiting' || step() === 'late'"></div>

      @switch (step()) {
        @case ('preparing') {
          <p class="bb-body-2" role="status">{{ i18n.t('payment_preparing') }}</p>
        }
        @case ('waiting') {
          <p class="bb-alert bb-alert--success" role="status">
            <bb-icon name="clock" [size]="20" />
            {{ i18n.t('payment_waiting_confirmation') }}
          </p>
        }
        @case ('late') {
          <p class="bb-alert" role="status">
            <bb-icon name="clock" [size]="20" />
            {{ i18n.t('payment_confirmation_late') }}
          </p>
          <bb-button (pressed)="waitForWebhook()"><bb-t key="retry" /></bb-button>
        }
      }

      @if (step() === 'ready' || step() === 'paying') {
        <bb-button [disabled]="step() === 'paying'" (pressed)="pay()">
          <bb-t
            [key]="step() === 'paying' ? 'payment_paying' : 'payment_pay'"
            [reserve]="['payment_paying', 'payment_pay']"
          />
          <bb-icon slot="right" name="lock" [size]="18" />
        </bb-button>
        <p class="bb-body-3 secure">{{ i18n.t('payment_secure_note') }}</p>
      }
    </bb-modal>
  `,
  styles: `
    .amount {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin: 0;
    }

    .amount strong {
      font-size: 1.75rem;
      color: var(--bb-title);
    }

    .element {
      min-height: 120px;
    }

    .secure {
      margin: 0;
      text-align: center;
    }

    .bb-alert {
      margin: 0;
    }
  `,
})
export class PaymentDialog {
  protected readonly i18n = inject(I18nService);
  protected readonly currency = inject(CurrencyService);
  private readonly stripeApi = inject(StripeService);
  private readonly transactions = inject(TransactionsService);

  readonly open = model(false);
  readonly transaction = input.required<Transaction>();
  /** Transaction confirmee apres paiement : le parent l'affiche. */
  readonly confirmed = output<Transaction>();

  private readonly mount = viewChild.required<ElementRef<HTMLElement>>('mount');

  protected readonly step = signal<Step>('preparing');
  protected readonly failure = signal<TranslationKey | null>(null);
  /** Message de Stripe (carte refusee...) : deja traduit par Stripe dans la langue passee. */
  protected readonly stripeMessage = signal<string | null>(null);

  private stripe: StripeClient | null = null;
  private elements: StripeElements | null = null;
  private element: StripeElement | null = null;

  /**
   * Incremente a chaque fermeture et a la destruction : une attente du webhook
   * deja lancee s'arrete au tour suivant au lieu de continuer a lire — et a
   * confirmer — une transaction que plus personne ne regarde.
   */
  private waitGeneration = 0;

  constructor() {
    effect(() => {
      if (this.open()) untracked(() => void this.prepare());
    });
    inject(DestroyRef).onDestroy(() => this.waitGeneration++);
  }

  private async prepare(): Promise<void> {
    this.step.set('preparing');
    this.failure.set(null);
    this.stripeMessage.set(null);
    const id = this.transaction().id;
    if (!id) return;
    // Deja paye (retour de 3-D Secure, ou webhook arrive entre-temps) : on ne recree rien.
    if (this.transaction().paidAt) {
      await this.waitForWebhook();
      return;
    }
    try {
      const [{ publishableKey }, { clientSecret }] = await Promise.all([
        firstValueFrom(this.stripeApi.config()),
        firstValueFrom(this.stripeApi.createPaymentIntent(id)),
      ]);
      this.stripe = await loadStripe(publishableKey);
      this.elements = this.stripe.elements({
        clientSecret,
        locale: this.i18n.language(),
        appearance: {
          theme: 'stripe',
          variables: { colorPrimary: '#0369a1', borderRadius: '12px' },
        },
      });
      this.element?.destroy();
      this.element = this.elements.create('payment');
      this.element.mount(this.mount().nativeElement);
      this.step.set('ready');
    } catch {
      this.failure.set('payment_unavailable');
      this.step.set('ready');
    }
  }

  protected async pay(): Promise<void> {
    if (!this.stripe || !this.elements || this.step() === 'paying') return;
    this.step.set('paying');
    this.failure.set(null);
    this.stripeMessage.set(null);
    const { error } = await this.stripe.confirmPayment({
      elements: this.elements,
      // 3-D Secure peut exiger une redirection : on revient sur cette meme page.
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });
    if (error) {
      this.stripeMessage.set(error.message ?? null);
      this.failure.set('payment_failed');
      this.step.set('ready');
      return;
    }
    await this.waitForWebhook();
  }

  /** Relit la transaction jusqu'a voir le paiement enregistre, puis la confirme. */
  async waitForWebhook(): Promise<void> {
    const id = this.transaction().id;
    if (!id) return;
    this.step.set('waiting');
    this.failure.set(null);
    const generation = this.waitGeneration;
    const deadline = Date.now() + WEBHOOK_WAIT_MS;
    while (Date.now() < deadline && generation === this.waitGeneration) {
      try {
        const paidAt = await firstValueFrom(this.transactions.paidAt(id));
        if (generation !== this.waitGeneration) return;
        if (paidAt) {
          const updated = await firstValueFrom(
            this.transactions.update(id, {
              ...this.transaction(),
              sellerStatus: TRANSACTION_STATUS.CONFIRMED,
              buyerStatus: TRANSACTION_STATUS.CONFIRMED,
            }),
          );
          this.confirmed.emit(updated);
          this.close();
          return;
        }
      } catch {
        // Relecture en echec : on retente jusqu'a l'echeance.
      }
      await new Promise((resolve) => setTimeout(resolve, WEBHOOK_POLL_MS));
    }
    if (generation === this.waitGeneration) this.step.set('late');
  }

  protected close(): void {
    this.waitGeneration++;
    this.element?.destroy();
    this.element = null;
    this.elements = null;
    this.open.set(false);
  }
}
