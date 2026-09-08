import { NgOptimizedImage } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { HowStep } from '../../shared/ui/how-step';
import { RoundIcon } from '../../shared/ui/round-icon';

/** Portage de app/start.js : vitrine publique + entree dans le tunnel Keycloak. */
@Component({
  selector: 'bb-start-page',
  imports: [NgOptimizedImage, Button, HowStep, RoundIcon, Icon],
  template: `
    <div class="screen">
      <div class="wrapper">
        <header class="head">
          <span class="logo">
            <img ngSrc="/logo.png" width="115" height="115" alt="" priority />
          </span>
          <h1 class="bb-display">BagBuddy</h1>
          <p class="bb-highlight">{{ i18n.t('start_subtitle') }}</p>
          <p class="bb-body-2">{{ i18n.t('start_description') }}</p>
        </header>

        <section class="bb-card features" [attr.aria-label]="i18n.t('how_card_title')">
          @for (feature of features; track feature.titleKey) {
            <div class="feature">
              <bb-round-icon
                [icon]="feature.icon"
                [size]="48"
                [background]="feature.background"
                [color]="feature.color"
              />
              <span class="bb-card-title">{{ i18n.t(feature.titleKey) }}</span>
              <span class="bb-card-subtitle">{{ i18n.t(feature.descriptionKey) }}</span>
            </div>
          }
        </section>

        <section class="bb-card">
          <h2 class="bb-card-title centered">{{ i18n.t('how_card_title') }}</h2>
          <div class="steps">
            <bb-how-step
              [number]="1"
              [title]="i18n.t('step_one_title')"
              [subtitle]="i18n.t('step_one_description')"
            />
            <bb-how-step
              [number]="2"
              [title]="i18n.t('step_two_title')"
              [subtitle]="i18n.t('step_two_description')"
            />
            <bb-how-step
              [number]="3"
              [title]="i18n.t('step_three_title')"
              [subtitle]="i18n.t('step_three_description')"
              color="var(--bb-success)"
              background="var(--bb-green-a10)"
            />
          </div>
        </section>

        <bb-button [text]="i18n.t('start_button')" (pressed)="signIn()">
          <bb-icon slot="right" name="arrow-right" [size]="24" />
        </bb-button>

        <div class="lang">
          <button
            type="button"
            [class.active]="i18n.language() === 'en'"
            (click)="i18n.changeLanguage('en')"
          >
            EN
          </button>
          <button
            type="button"
            [class.active]="i18n.language() === 'fr'"
            (click)="i18n.changeLanguage('fr')"
          >
            FR
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .screen {
      min-height: 100dvh;
      background: var(--bb-start-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
    }

    .wrapper {
      width: 100%;
      max-width: 560px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .head {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      text-align: center;
    }

    .logo {
      width: 96px;
      height: 96px;
      border-radius: 24px;
      background: var(--bb-primary-strong);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    }

    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    h1 {
      margin: 0;
    }

    .features {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .feature {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
    }

    .centered {
      text-align: center;
      margin-bottom: 16px;
    }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .lang {
      display: flex;
      justify-content: center;
      gap: 10px;
    }

    .lang button {
      padding: 6px 14px;
      border-radius: 12px;
      border: 1px solid var(--bb-tertiary);
      background: transparent;
      color: var(--bb-text);
      font-size: var(--bb-fs-body-2);
    }

    .lang button.active {
      background: var(--bb-primary-strong);
      border-color: var(--bb-primary-strong);
      color: var(--bb-white);
    }
  `,
})
export class StartPage {
  protected readonly i18n = inject(I18nService);
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

  protected signIn(): void {
    void this.auth.signIn('/home');
  }
}
