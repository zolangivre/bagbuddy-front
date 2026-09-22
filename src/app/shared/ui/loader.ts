import { Component, input } from '@angular/core';

/**
 * Remplace SafeActivityIndicator (animation Lottie cote mobile) par un
 * indicateur CSS aux couleurs de la marque.
 */
@Component({
  selector: 'bb-loader',
  template: `
    <div class="wrap" role="status" [attr.aria-label]="label()">
      <span class="spinner" [style.width.px]="size()" [style.height.px]="size()"></span>
      <span class="sr-only">{{ label() }}</span>
    </div>
  `,
  styles: `
    .wrap {
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner {
      border-radius: 999px;
      border: 3px solid var(--bb-cyan-a20);
      border-top-color: var(--bb-primary);
      animation: spin 0.9s linear infinite;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class Loader {
  readonly size = input(48);
  readonly label = input('Chargement');
}
