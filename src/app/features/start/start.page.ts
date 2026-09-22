import { NgOptimizedImage } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyService } from '../../core/currency.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { HowStep } from '../../shared/ui/how-step';
import { T } from '../../shared/ui/t';
import { RoundIcon } from '../../shared/ui/round-icon';

/** Portage de app/start.js : vitrine publique + entree vers l'inscription. */
@Component({
  selector: 'bb-start-page',
  imports: [T, NgOptimizedImage, RouterLink, Button, HowStep, RoundIcon, Icon],
  template: `
    <div class="screen">
      <div class="bb-page hero">
        <div class="pitch">
          <span class="logo">
            <img ngSrc="/logo.webp" width="56" height="84" alt="" priority />
          </span>
          <h1 class="bb-display">BagBuddy</h1>
          <p class="lede"><bb-t key="start_subtitle" /></p>
          <p class="bb-body"><bb-t key="start_description" /></p>

          <div class="cta">
            <bb-button (pressed)="createAccount()">
              <bb-t key="start_button" />
              <bb-icon slot="right" name="arrow-right" [size]="20" />
            </bb-button>
            <a class="signin" routerLink="/signin"><bb-t key="sign_in" /></a>
          </div>

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
        </div>

        <!--
          Le visiteur voit tout de suite l'objet du service : une annonce, dans
          la forme exacte qu'elle aura dans l'app. Decoratif, donc masque aux
          lecteurs d'ecran — le texte de gauche dit deja tout.
        -->
        <div class="sample" aria-hidden="true">
          <div class="pass">
            <div class="pass-trip">
              <div class="pass-route">
                <span class="end">
                  <span class="bb-code">CDG</span>
                  <span class="bb-time">10:30</span>
                </span>
                <span class="leg">
                  <span class="dash"></span>
                  <bb-icon name="plane" [size]="18" />
                  <span class="dash"></span>
                </span>
                <span class="end end--right">
                  <span class="bb-code">DKR</span>
                  <span class="bb-time">16:10</span>
                </span>
              </div>
              <p class="bb-body-3"><bb-t key="sample_conditions" /></p>
            </div>
            <div class="pass-stub">
              <span class="bb-body-3"><bb-t key="available_weight" /></span>
              <span class="bb-amount">8 kg</span>
              <span class="bb-body-3"><bb-t key="price_per_kg" /></span>
              <span class="bb-amount">{{ currency.format(9.5) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bb-page panels">
        <section class="bb-card features" [attr.aria-label]="i18n.t('how_card_title')">
          @for (feature of features; track feature.titleKey) {
            <div class="feature">
              <bb-round-icon
                [icon]="feature.icon"
                [size]="44"
                [background]="feature.background"
                [color]="feature.color"
              />
              <span class="bb-card-title"><bb-t [key]="feature.titleKey" /></span>
              <span class="bb-card-subtitle"><bb-t [key]="feature.descriptionKey" /></span>
            </div>
          }
        </section>

        <section class="bb-card">
          <h2 class="bb-card-title">{{ i18n.t('how_card_title') }}</h2>
          <div class="steps">
            <bb-how-step
              [number]="1"
              titleKey="step_one_title"
              subtitleKey="step_one_description"
            />
            <bb-how-step
              [number]="2"
              titleKey="step_two_title"
              subtitleKey="step_two_description"
            />
            <bb-how-step
              [number]="3"
              titleKey="step_three_title"
              subtitleKey="step_three_description"
              color="var(--bb-success)"
              background="var(--bb-green-a10)"
            />
          </div>
        </section>
      </div>
    </div>
  `,
  styles: `
    .screen {
      min-height: 100dvh;
      background: var(--bb-start-gradient);
      padding: 48px 0 64px;
      display: flex;
      flex-direction: column;
      gap: 48px;
    }

    .hero {
      display: grid;
      gap: 40px;
      align-items: center;
      grid-template-columns: 1fr;
    }

    .pitch {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      max-width: 36ch;
    }

    .logo {
      width: 84px;
      height: 84px;
      border-radius: 22px;
      background: var(--bb-primary-strong);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 18px 40px rgba(3, 105, 161, 0.28);
    }

    /* Hauteur de la pastille, largeur au ratio du fichier (2:3) : une image
       etiree en carre puis ramenee par object-fit fait diverger le ratio rendu
       du ratio reel, ce que NgOptimizedImage signale (NG02952). */
    .logo img {
      width: auto;
      height: 100%;
    }

    h1 {
      margin: 0;
    }

    .lede {
      margin: 0;
      font-size: var(--bb-fs-h2);
      font-weight: 500;
      color: var(--bb-primary);
      max-width: 26ch;
    }

    .pitch p.bb-body {
      margin: 0;
    }

    /* Deux entrees : creer un compte, ou revenir. La seconde est un lien, pas
       un second bouton — une seule action principale par ecran. */
    .cta {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .cta bb-button {
      width: auto;
      min-width: 260px;
    }

    .signin {
      font-size: var(--bb-fs-body);
      font-weight: 500;
      color: var(--bb-primary);
    }

    .signin:hover {
      text-decoration: underline;
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

    /* Annonce d'exemple, dans la forme de carte d'embarquement de l'app. */
    .sample {
      display: flex;
      justify-content: center;
    }

    .pass {
      width: 100%;
      max-width: 460px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 150px;
      background: var(--bb-card);
      border-radius: var(--bb-radius);
      box-shadow: var(--bb-shadow-raised);
      overflow: hidden;
      transform: rotate(-1.2deg);
    }

    .pass-trip {
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .pass-route {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .end {
      display: flex;
      flex-direction: column;
    }

    .end--right {
      text-align: right;
    }

    .leg {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--bb-primary);
    }

    .dash {
      flex: 1;
      border-top: 2px dashed var(--bb-cyan-a20);
    }

    .pass-trip p {
      margin: 0;
    }

    .pass-stub {
      padding: 22px 18px;
      background: var(--bb-cyan-a05);
      border-left: 2px dashed var(--bb-border);
      display: flex;
      flex-direction: column;
      gap: 2px;
      justify-content: center;
    }

    .pass-stub .bb-amount {
      margin-bottom: 10px;
    }

    .panels {
      display: grid;
      gap: 20px;
      grid-template-columns: 1fr;
    }

    .features {
      display: flex;
      gap: 24px;
    }

    .feature {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .bb-card h2 {
      margin: 0 0 20px;
    }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    @media (min-width: 900px) {
      .hero {
        grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
        gap: 48px;
      }

      .panels {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
})
export class StartPage {
  protected readonly i18n = inject(I18nService);
  protected readonly currency = inject(CurrencyService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly features = [
    {
      icon: 'plane',
      titleKey: 'feature_one_title',
      descriptionKey: 'feature_one_description',
      color: 'var(--bb-primary)',
      background: 'var(--bb-cyan-a10)',
    },
    {
      icon: 'dollar-sign',
      titleKey: 'feature_two_title',
      descriptionKey: 'feature_two_description',
      color: 'var(--bb-success)',
      background: 'var(--bb-green-a10)',
    },
    {
      icon: 'shield',
      titleKey: 'feature_three_title',
      descriptionKey: 'feature_three_description',
      color: 'var(--bb-warning)',
      background: 'var(--bb-yellow-a10)',
    },
  ] as const;

  constructor() {
    // Deja connecte : on file directement a l'accueil, comme le useEffect du mobile.
    effect(() => {
      if (this.auth.isSignedIn() && this.auth.userInfo()) {
        void this.router.navigate(['/home']);
      }
    });
  }

  protected createAccount(): void {
    void this.router.navigate(['/signup']);
  }
}
