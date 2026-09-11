import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../core/confirm.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Button } from './button';
import { Modal } from './modal';

/** Rend les confirmations et messages demandes via ConfirmService. */
@Component({
  selector: 'bb-dialog-host',
  imports: [Modal, Button],
  template: `
    @if (confirm.pending(); as request) {
      <bb-modal
        [open]="true"
        [title]="request.title"
        [closeLabel]="i18n.t('cancel')"
        (closed)="request.resolve(false)"
      >
        <p class="bb-body">{{ request.message }}</p>
        <div class="actions">
          <bb-button
            [text]="request.cancelText ?? i18n.t('cancel')"
            tone="primary"
            (pressed)="request.resolve(false)"
          />
          <bb-button
            [text]="request.confirmText"
            [tone]="request.tone"
            (pressed)="request.resolve(true)"
          />
        </div>
      </bb-modal>
    }

    @if (confirm.notice(); as notice) {
      <bb-modal
        [open]="true"
        [title]="notice.title"
        [closeLabel]="i18n.t('close')"
        (closed)="confirm.dismissNotice()"
      >
        <p class="bb-body">{{ notice.message }}</p>
        <bb-button [text]="i18n.t('close')" (pressed)="confirm.dismissNotice()" />
      </bb-modal>
    }
  `,
  styles: `
    .actions {
      display: flex;
      gap: 12px;
    }

    /* Moities egales : sinon « Annuler » et « Confirmer » se repartissent la
       ligne selon la longueur de leur libelle, qui depend de la langue. */
    .actions bb-button {
      flex: 1 1 0;
      min-width: 0;
    }

    p {
      margin: 0;
    }
  `,
})
export class DialogHost {
  protected readonly confirm = inject(ConfirmService);
  protected readonly i18n = inject(I18nService);
}
