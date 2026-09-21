import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GraphQlError } from '../../core/api/graphql.client';
import { loadErrorKeyOr } from '../../core/api/load-error';
import { ReportReason, UsersService } from '../../core/api/users.service';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Icon } from '../icon/icon';
import { Button } from './button';
import { Modal } from './modal';
import { T } from './t';
import { TextField } from './text-field';

const REASONS: { value: ReportReason; labelKey: TranslationKey }[] = [
  { value: 'PROHIBITED_ITEMS', labelKey: 'report_reason_prohibited_items' },
  { value: 'NO_SHOW', labelKey: 'report_reason_no_show' },
  { value: 'FRAUD', labelKey: 'report_reason_fraud' },
  { value: 'HARASSMENT', labelKey: 'report_reason_harassment' },
  { value: 'OTHER', labelKey: 'report_reason_other' },
];

/** Meme borne que ReportMemberRequest cote userservice. */
const DETAILS_MAX = 2000;

/**
 * Signaler un membre a la moderation, depuis son profil ou une transaction.
 *
 * Le composant porte son propre declencheur : les deux ecrans qui l'affichent
 * recopiaient sinon le meme bouton, ses styles et son signal d'ouverture.
 *
 * Un motif est obligatoire (liste courte, boutons radio : tout est visible
 * d'un coup d'oeil) ; le detail est libre. Apres l'envoi, la boite dit ce qui
 * va se passer plutot que de se fermer seule : un signalement est un geste qui
 * coute, il merite un accuse de reception.
 */
@Component({
  selector: 'bb-report-member-dialog',
  imports: [Modal, Button, TextField, Icon, T],
  template: `
    <button type="button" class="trigger" (click)="open.set(true)">
      <bb-icon name="flag" [size]="16" />
      {{ i18n.t('report_member') }}
    </button>

    <bb-modal
      [open]="open()"
      [title]="i18n.t('report_member_title', { name: memberName() })"
      [closeLabel]="i18n.t('close')"
      (closed)="close()"
    >
      @if (sent()) {
        <p #status class="bb-alert bb-alert--success" role="status" tabindex="-1">
          <bb-icon name="circle-check" [size]="20" />
          {{ i18n.t('report_sent') }}
        </p>
        <bb-button (pressed)="close()"><bb-t key="close" /></bb-button>
      } @else {
        <form novalidate [attr.aria-busy]="sending()" (submit)="submit($event)">
          <p class="bb-body-2 lede">{{ i18n.t('report_member_lede') }}</p>

          @if (failure(); as key) {
            <p #alert class="bb-alert" role="alert" tabindex="-1">
              <bb-icon name="circle-alert" [size]="20" />
              {{ i18n.t(key) }}
            </p>
          }

          <fieldset [attr.aria-describedby]="reasonMissing() ? 'report-reason-error' : null">
            <legend class="bb-section-title">{{ i18n.t('report_reason') }}</legend>
            @for (option of reasons; track option.value) {
              <label class="reason">
                <input
                  type="radio"
                  name="report-reason"
                  [value]="option.value"
                  [checked]="reason() === option.value"
                  [disabled]="sending()"
                  (change)="pick(option.value)"
                />
                {{ i18n.t(option.labelKey) }}
              </label>
            }
            @if (reasonMissing()) {
              <p id="report-reason-error" class="error">
                {{ i18n.t('error_report_reason_required') }}
              </p>
            }
          </fieldset>

          <bb-text-field
            [(value)]="details"
            [label]="i18n.t('report_details')"
            [hint]="i18n.t('report_details_hint')"
            [multiline]="true"
            [rows]="4"
            [maxLength]="detailsMax"
            [disabled]="sending()"
          />

          <bb-button type="submit" tone="error" [disabled]="sending()">
            <bb-t
              [key]="sending() ? 'sending_reset_link' : 'send_report'"
              [reserve]="['sending_reset_link', 'send_report']"
            />
            <bb-icon slot="right" name="flag" [size]="18" />
          </bb-button>
        </form>
      }
    </bb-modal>
  `,
  styles: `
    /* Discret, en retrait : une action rare, pas un appel a agir. */
    :host {
      align-self: flex-end;
    }

    .trigger {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 36px;
      padding: 0 10px;
      border: none;
      border-radius: var(--bb-radius-sm);
      background: transparent;
      color: var(--bb-text);
      font-size: var(--bb-fs-body-2);
    }

    .trigger:hover {
      background: var(--bb-red-a10);
      color: var(--bb-error);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .lede {
      margin: 0;
    }

    fieldset {
      border: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    legend {
      padding: 0;
      margin-bottom: 6px;
    }

    .reason {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 32px;
      color: var(--bb-title);
      cursor: pointer;
    }

    .reason input {
      width: 18px;
      height: 18px;
      accent-color: var(--bb-error-strong);
    }

    .error {
      margin: 0;
      color: var(--bb-error);
      font-size: var(--bb-fs-body-3);
    }
  `,
})
export class ReportMemberDialog {
  protected readonly i18n = inject(I18nService);
  private readonly users = inject(UsersService);
  private readonly injector = inject(Injector);

  readonly open = model(false);
  readonly memberSub = input.required<string>();
  readonly memberName = input('');
  /** La transaction d'ou vient le signalement, s'il y en a une. */
  readonly transactionId = input<string | undefined>(undefined);

  private readonly alert = viewChild<ElementRef<HTMLElement>>('alert');
  private readonly status = viewChild<ElementRef<HTMLElement>>('status');

  protected readonly reasons = REASONS;
  protected readonly detailsMax = DETAILS_MAX;
  protected readonly reason = signal<ReportReason | null>(null);
  protected readonly details = signal<string | number>('');
  protected readonly reasonMissing = signal(false);
  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  protected readonly failure = signal<TranslationKey | null>(null);

  protected pick(reason: ReportReason): void {
    this.reason.set(reason);
    this.reasonMissing.set(false);
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    const reason = this.reason();
    if (!reason) {
      this.reasonMissing.set(true);
      return;
    }
    if (this.sending()) return;

    this.sending.set(true);
    this.failure.set(null);
    try {
      await firstValueFrom(
        this.users.reportMember({
          reportedSub: this.memberSub(),
          transactionId: this.transactionId(),
          reason,
          details: String(this.details()).trim() || undefined,
        }),
      );
      this.sent.set(true);
      afterNextRender(() => this.status()?.nativeElement.focus(), { injector: this.injector });
    } catch (cause) {
      this.failure.set(this.failureKey(cause));
      afterNextRender(() => this.alert()?.nativeElement.focus(), { injector: this.injector });
    } finally {
      this.sending.set(false);
    }
  }

  /** Remise a zero a la fermeture : un second signalement repart d'un formulaire vide. */
  protected close(): void {
    this.open.set(false);
    this.reason.set(null);
    this.details.set('');
    this.reasonMissing.set(false);
    this.failure.set(null);
    this.sent.set(false);
  }

  private failureKey(cause: unknown): TranslationKey {
    if (cause instanceof GraphQlError && cause.code === 'too_many_reports') {
      return 'error_too_many_reports';
    }
    return loadErrorKeyOr(cause, 'error_report_failed');
  }
}
