import { NgOptimizedImage } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { T } from '../../shared/ui/t';

/**
 * Cadre commun a la connexion et a l'inscription.
 *
 * L'ecran d'acces est le premier que voit un visiteur apres la vitrine : il
 * reprend donc la carte d'embarquement de l'app, formulaire du cote du trajet
 * et talon a droite. Le talon porte ce que la page doit dire et que le
 * formulaire ne dit pas — pourquoi remplir ces champs. Sous 900px il passe
 * sous le formulaire, comme les annonces.
 */
@Component({
  selector: 'bb-auth-shell',
  imports: [RouterLink, NgOptimizedImage, Icon, T],
  template: `
    <div class="screen">
      <header class="bar bb-page">
        <a class="brand" routerLink="/start">
          <span class="mark">
            <img ngSrc="/logo.webp" width="24" height="36" alt="" />
          </span>
          BagBuddy
        </a>

        <div class="lang">
          <button
            type="button"
            [class.active]="i18n.language() === 'en'"
            [attr.aria-pressed]="i18n.language() === 'en'"
            (click)="i18n.changeLanguage('en')"
          >
            EN
          </button>
          <button
            type="button"
            [class.active]="i18n.language() === 'fr'"
            [attr.aria-pressed]="i18n.language() === 'fr'"
            (click)="i18n.changeLanguage('fr')"
          >
            FR
          </button>
        </div>
      </header>

      <main class="bb-page">
        <div class="pass">
          <section class="form">
            <h1 class="bb-title-md"><bb-t [key]="titleKey()" /></h1>
            <p class="bb-body-2 lede"><bb-t [key]="ledeKey()" /></p>
            <ng-content />
          </section>

          <aside class="stub">
            <span class="bb-code route">
              JFK
              <bb-icon name="plane" [size]="18" />
              CDG
            </span>
            <ul>
              <li>
                <bb-icon name="plane-takeoff" [size]="18" />
                <bb-t key="auth_promise_one" />
              </li>
              <li>
                <bb-icon name="dollar-sign" [size]="18" />
                <bb-t key="auth_promise_two" />
              </li>
              <li>
                <bb-icon name="shield" [size]="18" />
                <bb-t key="auth_promise_three" />
              </li>
            </ul>
          </aside>
        </div>

        <p class="switch">
          <ng-content select="[slot=switch]" />
        </p>
      </main>
    </div>
  `,
  styles: `
    .screen {
      min-height: 100dvh;
      background: var(--bb-start-gradient);
      display: flex;
      flex-direction: column;
      gap: 40px;
      padding-bottom: 64px;
    }

    .bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-top: 24px;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: var(--bb-fs-h4);
      font-weight: 600;
      color: var(--bb-title);
    }

    .mark img {
      width: 22px;
      height: auto;
    }

    .mark {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--bb-primary-strong);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .lang {
      display: flex;
      gap: 10px;
    }

    .lang button {
      padding: 6px 14px;
      border-radius: var(--bb-radius-sm);
      border: 1px solid var(--bb-border);
      background: transparent;
      color: var(--bb-text);
      font-size: var(--bb-fs-body-2);
    }

    .lang button.active {
      background: var(--bb-primary-strong);
      border-color: var(--bb-primary-strong);
      color: var(--bb-white);
    }

    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .pass {
      width: 100%;
      max-width: 880px;
      display: grid;
      grid-template-columns: 1fr;
      background: var(--bb-card);
      border-radius: var(--bb-radius);
      box-shadow: var(--bb-shadow-raised);
    }

    .form {
      padding: 32px 28px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form h1 {
      margin: 0;
    }

    .lede {
      margin: 0 0 12px;
      max-width: 42ch;
    }

    /* Le talon de la carte d'embarquement : meme perforation que les annonces. */
    .stub {
      position: relative;
      padding: 24px 28px;
      border-radius: 0 0 var(--bb-radius) var(--bb-radius);
      display: flex;
      flex-direction: column;
      gap: 18px;
      background: var(--bb-cyan-a05);
      border-top: 2px dashed var(--bb-border);
    }

    .stub::before,
    .stub::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      background: var(--bb-background);
      top: -12px;
    }

    .stub::before {
      left: -10px;
    }

    .stub::after {
      right: -10px;
    }

    .route {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--bb-primary);
      font-size: 1.5rem;
    }

    .stub ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .stub li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: var(--bb-fs-body-2);
      color: var(--bb-text);
    }

    .stub li bb-icon {
      color: var(--bb-primary);
      flex: none;
      margin-top: 2px;
    }

    /* Question et lien projetes cote a cote. L'espace vient du gap et non du
       texte : Angular supprime l'espace seul entre deux elements, et
       <bb-t /> <a> se collerait. */
    .switch {
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      column-gap: 6px;
      font-size: var(--bb-fs-body-2);
      color: var(--bb-text);
    }

    @media (min-width: 900px) {
      /* Colonne de formulaire bornee, et non dimensionnee sur son contenu :
         sinon la carte entiere s'elargit en francais. */
      .pass {
        grid-template-columns: minmax(0, 580px) 300px;
      }

      .form {
        padding: 40px 36px;
      }

      .stub {
        border-top: none;
        border-left: 2px dashed var(--bb-border);
        border-radius: 0 var(--bb-radius) var(--bb-radius) 0;
        justify-content: center;
      }

      .stub::before,
      .stub::after {
        left: -12px;
        right: auto;
      }

      .stub::before {
        top: -10px;
      }

      .stub::after {
        top: auto;
        bottom: -10px;
      }
    }
  `,
})
export class AuthShell {
  protected readonly i18n = inject(I18nService);

  /** Cles de traduction : rendues par `bb-t`, la carte garde donc la meme
   * taille d'une langue a l'autre. */
  readonly titleKey = input.required<TranslationKey>();
  readonly ledeKey = input.required<TranslationKey>();
}
