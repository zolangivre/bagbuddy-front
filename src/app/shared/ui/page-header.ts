import { Component, input } from '@angular/core';

/**
 * En-tete degrade bleu commun a home / transactions / profil dans l'app mobile.
 */
@Component({
  selector: 'bb-page-header',
  template: `
    <header class="bb-header-gradient" [style.padding-bottom.px]="32 + overlap()">
      <div class="inner">
        <div class="top">
          <div class="titles">
            <h1 class="bb-title-lg">{{ title() }}</h1>
            @if (subtitle()) {
              <p class="bb-muted">{{ subtitle() }}</p>
            }
          </div>
          <ng-content select="[slot=aside]" />
        </div>
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    header {
      padding: 32px 0 32px;
    }

    .inner {
      max-width: 1120px;
      margin: 0 auto;
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .titles {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    h1,
    p {
      margin: 0;
    }
  `,
})
export class PageHeader {
  readonly title = input('');
  readonly subtitle = input('');
  /**
   * Hauteur supplementaire en bas du degrade, pour les pages dont le contenu
   * remonte par-dessus (profil), comme le header de 200px du mobile.
   */
  readonly overlap = input(0);
}
