import { Component, computed, input } from '@angular/core';
import { ICONS, IconName } from './icons';

/**
 * Rendu des icones Lucide (memes icones que lucide-react-native cote mobile).
 * Les formes sont des donnees statiques, pas du HTML injecte, donc rien ne
 * passe par le sanitizer.
 */
@Component({
  selector: 'bb-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @for (shape of shapes(); track $index) {
        @switch (shape.tag) {
          @case ('path') {
            <path [attr.d]="shape.attrs['d']" [attr.fill]="fill()" />
          }
          @case ('circle') {
            <circle
              [attr.cx]="shape.attrs['cx']"
              [attr.cy]="shape.attrs['cy']"
              [attr.r]="shape.attrs['r']"
              [attr.fill]="fill()"
            />
          }
          @case ('rect') {
            <rect
              [attr.x]="shape.attrs['x']"
              [attr.y]="shape.attrs['y']"
              [attr.width]="shape.attrs['width']"
              [attr.height]="shape.attrs['height']"
              [attr.rx]="shape.attrs['rx']"
              [attr.ry]="shape.attrs['ry']"
            />
          }
          @case ('line') {
            <line
              [attr.x1]="shape.attrs['x1']"
              [attr.y1]="shape.attrs['y1']"
              [attr.x2]="shape.attrs['x2']"
              [attr.y2]="shape.attrs['y2']"
            />
          }
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      line-height: 0;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(24);
  readonly strokeWidth = input(2);
  /** `currentColor` pour les icones pleines (etoiles de notation). */
  readonly fill = input('none');

  protected readonly shapes = computed(() => ICONS[this.name()] ?? []);
}
