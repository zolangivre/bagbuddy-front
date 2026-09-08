import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { initialsOf } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';
import { Avatar } from './avatar';

interface NavItem {
  path: string;
  labelKey: 'home' | 'transactions' | 'profile';
  icon: IconName;
  color: string;
}

/**
 * Navigation principale. Le mobile a une tab bar en bas (home / transactions /
 * profil, onglet actif colore) ; on la garde telle quelle sur petit ecran et on
 * la remonte en barre horizontale sur grand ecran.
 */
@Component({
  selector: 'bb-app-nav',
  imports: [RouterLink, RouterLinkActive, Icon, Avatar],
  template: `
    <nav class="top" [attr.aria-label]="i18n.t('home')">
      <a class="brand" routerLink="/home">
        <span class="mark" aria-hidden="true">
          <bb-icon name="luggage" [size]="20" />
        </span>
        BagBuddy
      </a>

      <ul>
        @for (item of items; track item.path) {
          <li>
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              [style.--active-color]="item.color"
            >
              <bb-icon [name]="item.icon" [size]="20" />
              {{ i18n.t(item.labelKey) }}
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
          <bb-icon [name]="item.icon" [size]="24" />
          <span>{{ i18n.t(item.labelKey) }}</span>
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

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: var(--bb-fs-h3);
      font-weight: 700;
      color: var(--bb-title);
    }

    .mark {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: var(--bb-primary-strong);
      color: var(--bb-white);
      display: inline-flex;
      align-items: center;
      justify-content: center;
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

  protected readonly items: NavItem[] = [
    { path: '/home', labelKey: 'home', icon: 'house', color: 'var(--bb-primary-strong)' },
    {
      path: '/transactions',
      labelKey: 'transactions',
      icon: 'credit-card',
      color: 'var(--bb-success-strong)',
    },
    { path: '/profile', labelKey: 'profile', icon: 'user', color: 'var(--bb-warning-strong)' },
  ];

  protected readonly initials = computed(() => initialsOf(this.auth.userInfo()?.name, '?'));
}
