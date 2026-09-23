import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PendingActionsService } from '../../core/pending-actions.service';
import { initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';
import { Avatar } from './avatar';
import { T } from './t';

interface NavItem {
  path: string;
  labelKey: 'home' | 'transactions' | 'profile';
  icon: IconName;
  color: string;
  /**
   * Porte la pastille « a toi de jouer » (PendingActionsService). Declare ici
   * plutot que teste sur le chemin dans les deux barres : renommer la route ne
   * doit pas eteindre la pastille sans bruit.
   */
  badged?: boolean;
}

/**
 * Navigation principale. Le mobile a une tab bar en bas (home / transactions /
 * profil, onglet actif colore) ; on la garde telle quelle sur petit ecran et on
 * la remonte en barre horizontale sur grand ecran.
 */
@Component({
  selector: 'bb-app-nav',
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive, Icon, Avatar, T],
  template: `
    <nav class="top" [attr.aria-label]="i18n.t('home')">
      <a class="brand" routerLink="/home">
        <img ngSrc="/logo.webp" width="106" height="36" alt="BagBuddy" priority />
      </a>

      <ul>
        @for (item of items; track item.path) {
          <li>
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              [style.--active-color]="item.color"
            >
              <span class="icon">
                <bb-icon [name]="item.icon" [size]="20" />
                @if (item.badged && pendingBadge(); as badge) {
                  <span class="pending" aria-hidden="true">{{ badge }}</span>
                }
              </span>
              <bb-t [key]="item.labelKey" />
              <!-- Apres le libelle : le lien se lit « Transactions, 2 transactions attendent… ». -->
              @if (item.badged && pendingLabel(); as label) {
                <span class="sr-only">, {{ label }}</span>
              }
            </a>
          </li>
        }
      </ul>

      <a class="me" routerLink="/profile" [attr.aria-label]="i18n.t('profile')">
        <bb-avatar [initials]="initials()" [size]="36" />
      </a>
    </nav>

    <nav class="bottom" [attr.aria-label]="i18n.t('home')">
      @for (item of items; track item.path) {
        <a [routerLink]="item.path" routerLinkActive="active" [style.--active-color]="item.color">
          <span class="icon">
            <bb-icon [name]="item.icon" [size]="24" />
            @if (item.badged && pendingBadge(); as badge) {
              <span class="pending" aria-hidden="true">{{ badge }}</span>
            }
          </span>
          <bb-t [key]="item.labelKey" />
          <!-- Apres le libelle : le lien se lit « Transactions, 2 transactions attendent… ». -->
          @if (item.badged && pendingLabel(); as label) {
            <span class="sr-only">, {{ label }}</span>
          }
        </a>
      }
    </nav>
  `,
  styles: `
    .top {
      position: sticky;
      top: 0;
      z-index: 20;
      display: none;
      align-items: center;
      gap: 24px;
      padding: 12px 24px;
      background: var(--bb-card);
      border-bottom: 1px solid var(--bb-border);
    }

    /* Le logo porte le nom : le texte « BagBuddy » a cote ferait doublon. */
    .brand {
      display: inline-flex;
      flex-shrink: 0;
    }

    .brand img {
      width: auto;
      height: 36px;
    }

    ul {
      list-style: none;
      display: flex;
      gap: 8px;
      margin: 0 auto 0 16px;
      padding: 0;
    }

    .top a:not(.brand):not(.me) {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 12px;
      color: var(--bb-text);
      font-weight: 500;
    }

    .top a:not(.brand):not(.me):hover {
      background: var(--bb-cyan-a10);
      color: var(--bb-primary);
    }

    /* Specificite alignee sur la regle des liens ci-dessus, sinon la couleur de
       texte inactive l'emporte sur la pastille coloree. */
    .top a.active:not(.brand):not(.me) {
      background: var(--active-color);
      color: var(--bb-white);
    }

    .bottom {
      position: fixed;
      inset: auto 0 0 0;
      z-index: 20;
      display: flex;
      gap: 8px;
      padding: 8px 10px;
      padding-bottom: max(8px, env(safe-area-inset-bottom));
      background: var(--bb-card);
      border-top-left-radius: var(--bb-radius);
      border-top-right-radius: var(--bb-radius);
      box-shadow: 0 -3px 12px rgba(0, 0, 0, 0.1);
    }

    .bottom a {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 10px 0;
      border-radius: 12px;
      color: var(--bb-title);
      font-size: var(--bb-fs-body-3);
      font-weight: 500;
    }

    .bottom a.active {
      background: var(--active-color);
      color: var(--bb-white);
    }

    /* Pastille posee sur l'icone, hors du flux : l'onglet garde sa largeur, et
       rien ne bouge quand elle apparait ou change de nombre. Surface -strong
       sous texte blanc, cernee de la couleur de la barre pour rester lisible
       sur l'onglet actif, lui aussi colore. */
    .icon {
      position: relative;
      display: inline-flex;
    }

    .pending {
      position: absolute;
      /* Ancree par la droite, 4px au-dela de l'icone (anneau compris, moins que
         l'ecart de 8px avec le libelle) : « 9+ » s'elargit vers l'icone, jamais
         sur le texte. */
      top: -8px;
      right: -4px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 999px;
      background: var(--bb-error-strong);
      color: var(--bb-white);
      box-shadow: 0 0 0 2px var(--bb-card);
      font-size: 0.6875rem;
      font-weight: 700;
      line-height: 16px;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }

    @media (min-width: 768px) {
      .top {
        display: flex;
      }

      .bottom {
        display: none;
      }
    }
  `,
})
export class AppNav {
  protected readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly pendingActions = inject(PendingActionsService);

  protected readonly items: NavItem[] = [
    { path: '/home', labelKey: 'home', icon: 'house', color: 'var(--bb-primary-strong)' },
    {
      path: '/transactions',
      labelKey: 'transactions',
      icon: 'credit-card',
      color: 'var(--bb-success-strong)',
      badged: true,
    },
    { path: '/profile', labelKey: 'profile', icon: 'user', color: 'var(--bb-warning-strong)' },
  ];

  /** Rien tant que le nombre est inconnu ou nul : une pastille « 0 » ne dit rien. */
  protected readonly pendingLabel = computed(() => {
    const count = this.pendingActions.count();
    if (!count) return null;
    return count === 1
      ? this.i18n.t('pending_actions_one')
      : this.i18n.t('pending_actions_other', { count });
  });

  protected readonly pendingBadge = computed(() => {
    const count = this.pendingActions.count();
    if (!count) return null;
    return count > 9 ? '9+' : String(count);
  });

  protected readonly initials = computed(() => initialsOf(this.auth.userInfo()?.name, '?'));
}
