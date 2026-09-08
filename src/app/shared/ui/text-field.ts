import { Component, input, model } from '@angular/core';

/** Portage de components/Input.js et NumberInput.js. */
@Component({
  selector: 'bb-text-field',
  template: `
    <label class="field">
      @if (label()) {
        <span class="bb-body-2">{{ label() }}</span>
      }
      @if (multiline()) {
        <textarea
          [value]="value()"
          [placeholder]="placeholder()"
          [rows]="rows()"
          [attr.aria-invalid]="!!error()"
          (input)="onInput($event)"
        ></textarea>
      } @else {
        <input
          [type]="type()"
          [value]="value()"
          [placeholder]="placeholder()"
          [attr.min]="minValue()"
          [attr.max]="maxValue()"
          [attr.step]="stepValue()"
          [attr.aria-invalid]="!!error()"
          (input)="onInput($event)"
        />
      }
      @if (error(); as message) {
        <span class="error">{{ message }}</span>
      }
    </label>
  `,
  styles: `
    :host {
      display: block;
      flex: 1;
      min-width: 0;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    input,
    textarea {
      width: 100%;
      border: 1px solid transparent;
      border-radius: var(--bb-radius);
      background: var(--bb-input);
      color: var(--bb-title);
      padding: 12px;
      font-family: inherit;
      font-size: var(--bb-fs-body);
    }

    input {
      height: 48px;
      padding: 0 12px;
    }

    textarea {
      resize: vertical;
    }

    input[aria-invalid='true'],
    textarea[aria-invalid='true'] {
      border-color: var(--bb-error);
    }

    .error {
      font-size: var(--bb-fs-body-3);
      color: var(--bb-error);
    }
  `,
})
export class TextField {
  readonly label = input('');
  readonly placeholder = input('');
  readonly type = input<'text' | 'number' | 'datetime-local' | 'email' | 'tel'>('text');
  readonly multiline = input(false);
  readonly rows = input(4);
  readonly minValue = input<number | null>(null);
  readonly maxValue = input<number | null>(null);
  readonly stepValue = input<string | number | null>(null);
  readonly error = input<string | null>(null);
  readonly value = model<string | number>('');

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }
}
