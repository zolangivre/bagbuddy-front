import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GraphQlError } from '../../core/api/graphql.client';
import { loadErrorKeyOr } from '../../core/api/load-error';
import { TransactionsService } from '../../core/api/transactions.service';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Role, Transaction } from '../../core/models';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { T } from '../../shared/ui/t';

/**
 * Code de remise d'une transaction payee.
 *
 * L'acheteur voit le code et le transmet au destinataire du colis ; le voyageur
 * le recoit a la livraison et le saisit pour clore la transaction. C'est ce qui
 * prouve la remise : le voyageur ne voit jamais le code avant.
 *
 * Cote voyageur, 5 codes faux bloquent la saisie (le serveur compte) : l'ecran
 * le dit, et c'est alors a l'acheteur de confirmer la livraison.
 */
@Component({
  selector: 'bb-handover-card',
  imports: [Icon, Button, T],
  template: `
    <section class="bb-card">
      <h2 class="bb-card-title">
        <bb-icon name="key-round" [size]="22" />
        {{ i18n.t('handover_title') }}
      </h2>

      @if (role() === 'buyer') {
        @if (transaction().handoverCode; as code) {
          <p class="bb-body-2 lede">{{ i18n.t('handover_buyer_lede') }}</p>
          <div class="code-row">
            <span class="code bb-code" [attr.aria-label]="spelled(code)">{{ grouped(code) }}</span>
            <button type="button" class="copy" (click)="copy(code)">
              <bb-icon [name]="copied() ? 'check' : 'copy'" [size]="18" />
              <span aria-live="polite">{{ i18n.t(copied() ? 'copied' : 'copy_code') }}</span>
            </button>
          </div>
          @if (transaction().handoverLocked) {
            <p class="bb-alert" role="status">
              <bb-icon name="circle-alert" [size]="20" />
              {{ i18n.t('handover_locked_buyer') }}
            </p>
          }
        }
      } @else if (transaction().handoverLocked || locked()) {
        <p class="bb-alert" role="alert">
          <bb-icon name="circle-alert" [size]="20" />
          {{ i18n.t('handover_locked_seller') }}
        </p>
      } @else {
        <p class="bb-body-2 lede">{{ i18n.t('handover_seller_lede') }}</p>
        <form novalidate [attr.aria-busy]="sending()" (submit)="submit($event)">
          @if (failure(); as key) {
            <p #alert class="bb-alert" role="alert" tabindex="-1">
              <bb-icon name="circle-alert" [size]="20" />
              {{ i18n.t(key) }}
            </p>
          }
          <label class="field">
            <span class="label">{{ i18n.t('handover_code_label') }}</span>
            <input
              #codeInput
              class="bb-code"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="7"
              placeholder="000 000"
              [value]="code()"
              [disabled]="sending()"
              [attr.aria-invalid]="!!failure()"
              (input)="code.set($any($event.target).value)"
            />
          </label>
          <bb-button type="submit" tone="success" [disabled]="sending()">
            <bb-t
              [key]="sending() ? 'saving' : 'confirm_handover'"
              [reserve]="['saving', 'confirm_handover']"
            />
            <bb-icon slot="right" name="circle-check" [size]="20" />
          </bb-button>
        </form>
      }
    </section>
  `,
  styles: `
    .bb-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: var(--bb-title);
    }

    h2 bb-icon {
      color: var(--bb-primary);
    }

    .lede {
      margin: 0;
    }

    .code-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .code {
      font-size: 2.5rem;
      letter-spacing: 0.08em;
      color: var(--bb-title);
    }

    .copy {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 40px;
      padding: 0 12px;
      border: 1px solid var(--bb-border);
      border-radius: var(--bb-radius-sm);
      background: var(--bb-card);
      color: var(--bb-title);
      font-size: var(--bb-fs-body-2);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .label {
      font-size: var(--bb-fs-body-2);
      color: var(--bb-text);
    }

    input {
      max-width: 220px;
      height: 56px;
      padding: 0 16px;
      border: 1px solid transparent;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-input);
      color: var(--bb-title);
      font-size: 1.75rem;
      letter-spacing: 0.08em;
    }

    input[aria-invalid='true'] {
      border-color: var(--bb-error);
    }

    .bb-alert {
      margin: 0;
    }
  `,
})
export class HandoverCard {
  protected readonly i18n = inject(I18nService);
  private readonly transactions = inject(TransactionsService);
  private readonly injector = inject(Injector);

  readonly transaction = input.required<Transaction>();
  readonly role = input.required<Role>();
  /** La transaction close par le code : le parent l'affiche et previent. */
  readonly completed = output<Transaction>();

  private readonly alert = viewChild<ElementRef<HTMLElement>>('alert');
  private readonly codeInput = viewChild<ElementRef<HTMLInputElement>>('codeInput');

  protected readonly code = signal('');
  protected readonly sending = signal(false);
  protected readonly locked = signal(false);
  protected readonly copied = signal(false);
  protected readonly failure = signal<TranslationKey | null>(null);

  /** « 482 913 » se lit mieux que « 482913 », a l'ecran comme au telephone. */
  protected grouped(code: string): string {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }

  /** Un lecteur d'ecran lirait « quatre cent quatre-vingt-deux mille… » : chiffre par chiffre. */
  protected spelled(code: string): string {
    return code.split('').join(' ');
  }

  protected async copy(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Presse-papiers refuse : le code reste affiche, a recopier a la main.
    }
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    const id = this.transaction().id;
    const code = this.code().replace(/\s/g, '');
    if (!id || this.sending()) return;
    if (!/^\d{6}$/.test(code)) {
      this.fail('error_handover_code_format');
      return;
    }

    this.sending.set(true);
    this.failure.set(null);
    try {
      const updated = await firstValueFrom(this.transactions.confirmHandover(id, code));
      this.completed.emit(updated);
    } catch (cause) {
      const serverCode = cause instanceof GraphQlError ? cause.code : undefined;
      if (serverCode === 'handover_locked') {
        this.locked.set(true);
      } else if (serverCode === 'invalid_handover_code') {
        this.fail('error_handover_code_invalid');
      } else {
        this.fail(loadErrorKeyOr(cause, 'error_handover_failed'));
      }
    } finally {
      this.sending.set(false);
    }
  }

  private fail(key: TranslationKey): void {
    this.failure.set(key);
    this.code.set('');
    afterNextRender(
      () => {
        this.alert()?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }
}
