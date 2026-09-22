import { Component, input } from '@angular/core';

/**
 * Bandeau degrade des ecrans principaux, porte du mobile.
 *
 * Sur mobile c'etait un grand hero vertical : titre, sous-titre, puis les
 * statistiques empilees en dessous. Sur le web il devient une bande compacte ou
 * les chiffres viennent se poser a droite du titre, pour ne pas repousser le
 * contenu utile sous la ligne de flottaison.
 */
@Component({
  selector: 'bb-page-header',
  template: `
    <header class="bb-header-gradient" [style.padding-bottom.px]="24 + overlap()">
      <div class="inner">
        <div class="titles">
          <h1 class="bb-title-lg">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="bb-muted">{{ subtitle() }}</p>
          }
        </div>

        <div class="extras">
          <ng-content />
        </div>

        <div class="aside">
          <ng-content select="[slot=aside]" />
        </div>
      </div>
    </header>
  `,
  styles: `
    header {
      padding-top: 24px;
    }

    .inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: grid;
      gap: 20px;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'titles aside'
        'extras extras';
      align-items: center;
    }

    .titles {
      grid-area: titles;
    }

    .extras {
      grid-area: extras;
    }

    .aside {
      grid-area: aside;
    }

    .titles {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    h1,
    p {
      margin: 0;
    }

    p {
      max-width: 60ch;
    }

    .extras:empty {
      display: none;
    }

    .aside {
      display: flex;
      justify-content: flex-end;
    }

    @media (min-width: 900px) {
      header {
        padding-top: 32px;
      }

      .inner {
        grid-template-columns: minmax(0, 1fr) auto auto;
        grid-template-areas: 'titles extras aside';
        gap: 32px;
      }
    }
  `,
})
export class PageHeader {
  readonly title = input('');
  readonly subtitle = input('');
  /** Marge basse supplementaire quand le contenu remonte par-dessus (profil). */
  readonly overlap = input(0);
}
