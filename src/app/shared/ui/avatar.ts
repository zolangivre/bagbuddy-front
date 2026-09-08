import { Component, input } from '@angular/core';

/** Portage de components/Avatar.js. */
@Component({
  selector: 'bb-avatar',
  template: `<span
    [style.width.px]="size()"
    [style.height.px]="size()"
    [style.font-size.px]="size() / 2.5"
    aria-hidden="true"
    >{{ initials() }}</span
  >`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }

    span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: var(--bb-cyan-a10);
      border: 2px solid rgba(14, 165, 233, 0.1);
      color: var(--bb-primary);
      font-weight: 500;
    }
  `,
})
export class Avatar {
  readonly initials = input('??');
  readonly size = input(44);
}
