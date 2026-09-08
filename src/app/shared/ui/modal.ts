import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * Boite de dialogue basee sur <dialog> natif : piege de focus, fermeture Echap
 * et backdrop fournis par le navigateur. Remplace les <Modal> du mobile.
 */
@Component({
  selector: 'bb-modal',
  imports: [Icon],
  template: `
    <dialog #dialog (close)="closed.emit()" (click)="onBackdropClick($event)">
      <div class="panel" (click)="$event.stopPropagation()">
        <header>
          <h2 class="bb-card-title">{{ title() }}</h2>
          <button type="button" class="close" [attr.aria-label]="closeLabel()" (click)="close()">
            <bb-icon name="x" [size]="24" />
          </button>
        </header>
        <div class="content">
          <ng-content />
        </div>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      border: none;
      padding: 0;
      /* Le reset Tailwind met margin: 0 partout, ce qui casse le centrage
         natif des <dialog> modaux : on le remet explicitement. */
      margin: auto;
      background: transparent;
      max-width: min(560px, calc(100vw - 32px));
      width: 100%;
      color: var(--bb-text);
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
    }

    .panel {
      background: var(--bb-card);
      border-radius: var(--bb-radius);
      padding: 20px;
      max-height: min(85vh, 720px);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    h2 {
      margin: 0;
    }

    .close {
      border: none;
      background: transparent;
      color: var(--bb-error);
      display: inline-flex;
      padding: 4px;
      border-radius: 8px;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `,
})
export class Modal {
  readonly open = input(false);
  readonly title = input('');
  readonly closeLabel = input('Fermer');
  readonly closed = output<void>();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialogRef().nativeElement;
      if (this.open()) {
        if (!dialog.open) dialog.showModal();
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  close(): void {
    this.dialogRef().nativeElement.close();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogRef().nativeElement) this.close();
  }
}
