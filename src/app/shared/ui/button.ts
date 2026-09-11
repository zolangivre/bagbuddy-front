import { Component, input, output } from '@angular/core';

export type ButtonTone = 'primary' | 'success' | 'error' | 'warning';

/** Portage de components/Button.js : pleine largeur, 48px, radius 16. */
@Component({
  selector: 'bb-button',
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      [attr.data-tone]="tone()"
      (click)="pressed.emit($event)"
    >
      <ng-content select="[slot=left]" />
      <!-- Libelle deja resolu via [text] ; sinon on projette, ce qui permet d'y
           placer un bb-t et de figer la largeur du bouton d'une langue a
           l'autre. -->
      <span><ng-content />{{ text() }}</span>
      <ng-content select="[slot=right]" />
    </button>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    button {
      width: 100%;
      min-height: 48px;
      padding: 0 20px;
      border: none;
      border-radius: var(--bb-radius);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--bb-white);
      font-size: 1.125rem;
      font-weight: 500;
      background: var(--bb-primary-strong);
      box-shadow: var(--bb-shadow-button);
      transition: filter 0.15s ease;
    }

    button[data-tone='success'] {
      background: var(--bb-success-strong);
    }
    button[data-tone='error'] {
      background: var(--bb-error-strong);
    }
    button[data-tone='warning'] {
      background: var(--bb-warning-strong);
    }

    button:hover:not(:disabled) {
      filter: brightness(1.06);
    }
    button:active:not(:disabled) {
      filter: brightness(0.95);
    }
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  `,
})
export class Button {
  readonly text = input('');
  readonly tone = input<ButtonTone>('primary');
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit'>('button');
  readonly pressed = output<MouseEvent>();
}
