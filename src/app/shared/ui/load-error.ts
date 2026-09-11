import { Component, inject, input, output } from '@angular/core';
import { LoadErrorKey } from '../../core/api/load-error';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../icon/icon';
import { Button } from './button';
import { T } from './t';

/**
 * Remplace le contenu d'une zone dont le chargement a echoue. Sans lui, les
 * ecrans retombaient sur leur etat vide (« Aucun resultat ») : une panne se
 * lisait comme une absence de donnees, et rien ne permettait de relancer.
 *
 * Meme hauteur minimale que `.bb-empty` et `bb-loader`, pour que la zone ne
 * saute pas en passant de l'un a l'autre. `role="alert"` : l'echec est annonce
 * au lecteur d'ecran au moment ou il remplace l'indicateur de chargement.
 */
@Component({
  selector: 'bb-load-error',
  imports: [Icon, Button, T],
  host: { role: 'alert' },
  template: `
    <bb-icon name="circle-alert" [size]="28" />
    <p>{{ i18n.t(messageKey()) }}</p>
    <bb-button (pressed)="retry.emit()"><bb-t key="retry" /></bb-button>
  `,
  styles: `
    :host {
      min-height: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px 0;
      text-align: center;
    }

    bb-icon {
      color: var(--bb-error);
    }

    p {
      margin: 0;
      max-width: 42ch;
      color: var(--bb-title);
      text-wrap: balance;
    }

    bb-button {
      width: min(100%, 220px);
      margin-top: 4px;
    }
  `,
})
export class LoadError {
  protected readonly i18n = inject(I18nService);

  readonly messageKey = input<LoadErrorKey>('load_error');
  readonly retry = output<void>();
}
