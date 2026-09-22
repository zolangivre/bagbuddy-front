import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GraphQlError } from '../../core/api/graphql.client';
import { loadErrorKey, loadErrorKeyOr } from '../../core/api/load-error';
import { TransactionsService } from '../../core/api/transactions.service';
import { formatLocalizedDate, formatLocalizedTime } from '../../core/format';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { TransactionMessage } from '../../core/models';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { T } from '../../shared/ui/t';

/** Relecture du fil tant que l'onglet est visible. */
const POLL_MS = 10_000;
/** Meme borne que transactionservice. */
const MESSAGE_MAX = 2000;

/**
 * Messagerie d'une transaction, entre ses deux parties : convenir de l'heure et
 * du comptoir de la remise sans echanger de numero.
 *
 * Pas de push cote back : le fil est relu toutes les 10 secondes quand l'onglet
 * est visible, en ne demandant que la suite (`afterId`). La liste porte
 * `role="log"`, qui annonce poliment les nouveaux messages a un lecteur d'ecran
 * sans lui faire relire tout le fil.
 */
@Component({
  selector: 'bb-transaction-chat',
  imports: [Icon, Button, T],
  template: `
    <section class="bb-card">
      <h2 class="bb-card-title">
        <bb-icon name="message-circle" [size]="22" />
        {{ i18n.t('chat_title') }}
      </h2>

      @if (loadError(); as key) {
        <p class="bb-alert" role="alert">
          <bb-icon name="circle-alert" [size]="20" />
          {{ i18n.t(key) }}
        </p>
      }

      <!-- role="log" sur l'enveloppe et non sur la liste : pose sur <ol>, il lui
           retirerait sa semantique de liste et ses <li> deviendraient orphelins. -->
      <div #log class="log" role="log" [attr.aria-label]="i18n.t('chat_title')">
        @if (messages().length) {
          <ol>
            @for (message of messages(); track message.id) {
              <li [class.mine]="message.mine">
                <span class="sr-only">{{ i18n.t(message.mine ? 'chat_you' : 'chat_them') }}</span>
                <p class="body">{{ message.body }}</p>
                <span class="meta bb-body-3">{{ when(message.createdAt) }}</span>
              </li>
            }
          </ol>
        } @else {
          <p class="empty bb-body-2">{{ i18n.t('chat_empty') }}</p>
        }
      </div>

      @if (closed()) {
        <p class="bb-body-2 closed">{{ i18n.t('chat_closed') }}</p>
      } @else {
        <form novalidate (submit)="send($event)">
          @if (sendError(); as key) {
            <p class="bb-alert" role="alert">
              <bb-icon name="circle-alert" [size]="20" />
              {{ i18n.t(key) }}
            </p>
          }
          <label class="sr-only" for="chat-input">{{ i18n.t('chat_placeholder') }}</label>
          <textarea
            id="chat-input"
            rows="2"
            [maxLength]="max"
            [placeholder]="i18n.t('chat_placeholder')"
            [value]="draft()"
            [disabled]="sending()"
            (input)="draft.set($any($event.target).value)"
            (keydown.enter)="onEnter($event)"
          ></textarea>
          <bb-button type="submit" [disabled]="sending() || !canSend()">
            <bb-t [key]="'chat_send'" />
            <bb-icon slot="right" name="send" [size]="18" />
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

    .log {
      max-height: 360px;
      overflow-y: auto;
      padding: 4px;
    }

    .log ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .log li {
      align-self: flex-start;
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 14px 14px 14px 4px;
      background: var(--bb-input);
      color: var(--bb-title);
    }

    .log li.mine {
      align-self: flex-end;
      border-radius: 14px 14px 4px 14px;
      background: var(--bb-cyan-a10);
    }

    .empty {
      margin: 8px 0;
      color: var(--bb-text);
      text-align: center;
    }

    .body {
      margin: 0;
      white-space: pre-line;
      overflow-wrap: anywhere;
    }

    .meta {
      display: block;
      margin-top: 2px;
      color: var(--bb-text);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      border: 1px solid transparent;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-input);
      color: var(--bb-title);
      font: inherit;
      resize: vertical;
    }

    form bb-button {
      width: auto;
      align-self: flex-end;
    }

    .closed {
      margin: 0;
      color: var(--bb-text);
    }

    .bb-alert {
      margin: 0;
    }
  `,
})
export class TransactionChat {
  protected readonly i18n = inject(I18nService);
  private readonly transactions = inject(TransactionsService);

  readonly transactionId = input.required<string>();
  /** Transaction annulee : le fil reste lisible, sans saisie. */
  readonly closed = input(false);

  private readonly log = viewChild<ElementRef<HTMLElement>>('log');

  protected readonly max = MESSAGE_MAX;
  protected readonly messages = signal<TransactionMessage[]>([]);
  protected readonly draft = signal('');
  protected readonly sending = signal(false);
  protected readonly loadError = signal<TranslationKey | null>(null);
  protected readonly sendError = signal<TranslationKey | null>(null);
  protected readonly canSend = computed(() => this.draft().trim().length > 0);

  private polling = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      void this.refresh(true);
      const timer = setInterval(() => {
        // Onglet cache, ou conversation close (transaction annulee) : rien ne peut arriver.
        if (document.visibilityState === 'visible' && !this.closed()) void this.refresh(false);
      }, POLL_MS);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
  }

  protected when(createdAt: string): string {
    const lang = this.i18n.language();
    return `${formatLocalizedDate(createdAt, lang)} · ${formatLocalizedTime(createdAt, lang)}`;
  }

  /** Entree envoie, Maj+Entree passe a la ligne. */
  protected onEnter(event: Event): void {
    const keyboard = event as KeyboardEvent;
    if (keyboard.shiftKey || keyboard.isComposing) return;
    event.preventDefault();
    void this.send(event);
  }

  protected async send(event: Event): Promise<void> {
    event.preventDefault();
    const body = this.draft().trim();
    if (!body || this.sending()) return;
    this.sending.set(true);
    this.sendError.set(null);
    try {
      const message = await firstValueFrom(
        this.transactions.sendMessage(this.transactionId(), body),
      );
      this.append([message]);
      this.draft.set('');
    } catch (cause) {
      const code = cause instanceof GraphQlError ? cause.code : undefined;
      if (code === 'too_many_messages') this.sendError.set('error_chat_too_fast');
      else if (code === 'conversation_closed') this.sendError.set('chat_closed');
      else {
        this.sendError.set(loadErrorKeyOr(cause, 'error_chat_send'));
      }
    } finally {
      this.sending.set(false);
    }
  }

  private async refresh(initial: boolean): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    const last = this.messages().at(-1)?.id;
    try {
      const next = await firstValueFrom(this.transactions.messages(this.transactionId(), last));
      this.loadError.set(null);
      if (next.length || initial) this.append(next);
    } catch (cause) {
      // Une relecture de fond en echec ne vide pas le fil deja affiche.
      if (initial) this.loadError.set(loadErrorKey(cause));
    } finally {
      this.polling = false;
    }
  }

  /** Sans doublon (un envoi et une relecture peuvent ramener le meme message), puis en bas. */
  private append(incoming: TransactionMessage[]): void {
    const element = this.log()?.nativeElement;
    const atBottom =
      !element || element.scrollHeight - element.scrollTop - element.clientHeight < 40;
    this.messages.update((shown) => {
      const ids = new Set(shown.map((message) => message.id));
      return shown.concat(incoming.filter((message) => !ids.has(message.id)));
    });
    // On ne ramene en bas que qui y etait deja : quelqu'un qui relit plus haut garde sa place.
    if (atBottom) {
      requestAnimationFrame(() => element?.scrollTo({ top: element.scrollHeight }));
    }
  }
}
