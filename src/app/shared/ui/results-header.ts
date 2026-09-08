import { Component, input } from '@angular/core';

/** Ligne au-dessus d'une liste de resultats : compte a gauche, tri a droite. */
@Component({
  selector: 'bb-results-header',
  template: `
    <div class="row">
      <p class="count bb-body-2">{{ label() }}</p>
      <ng-content />
    </div>
  `,
  styles: `
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .count {
      margin: 0;
      color: var(--bb-title);
      font-weight: 500;
    }
  `,
})
export class ResultsHeader {
  readonly label = input('');
}
