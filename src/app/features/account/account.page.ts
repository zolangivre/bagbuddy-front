import { Component, computed, inject, signal } from '@angular/core';
import { email, FieldTree, form, FormField, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GraphQlError } from '../../core/api/graphql.client';
import { UsersService } from '../../core/api/users.service';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/ui/avatar';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { SubHeader } from '../../shared/ui/sub-header';
import { TextField } from '../../shared/ui/text-field';

interface IdentityForm {
  firstName: string;
  lastName: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Portage de app/edit-profile.js, qui n'etait qu'une maquette : le mobile
 * renvoyait vers la console compte de Keycloak des qu'il fallait vraiment
 * changer quelque chose.
 *
 * Trois formulaires plutot qu'un seul bouton « enregistrer » : ils ne touchent
 * pas les memes donnees et n'ont pas les memes consequences. L'identite part
 * chez Keycloak, le profil public chez userservice, et le mot de passe demande
 * l'ancien. Chacun a donc son propre envoi et son propre message.
 *
 * A droite, la fiche telle que les autres membres la voient se met a jour
 * pendant la saisie : c'est la raison d'etre de la page, autant la montrer.
 */
@Component({
  selector: 'bb-account-page',
  imports: [SubHeader, TextField, Button, Avatar, Badge, Icon, FormField],
  template: `
    <bb-sub-header [title]="i18n.t('my_account')" (back)="goBack()" />

    <div class="bb-page content bb-with-rail bb-with-rail--aside">
      <div class="main">
        <section class="bb-card">
          <h2 class="bb-card-title">
            <bb-icon name="user" [size]="20" />
            {{ i18n.t('personal_information') }}
          </h2>

          <form (submit)="saveIdentity($event)">
            @if (identityFailure(); as message) {
              <p class="alert" role="alert">
                <bb-icon name="circle-alert" [size]="20" />
                {{ message }}
              </p>
            }

            <div class="row">
              <bb-text-field
                [formField]="identity.firstName"
                autocomplete="given-name"
                [label]="i18n.t('first_name')"
                [placeholder]="i18n.t('first_name_placeholder')"
                [error]="errorOf(identity.firstName)"
              />
              <bb-text-field
                [formField]="identity.lastName"
                autocomplete="family-name"
                [label]="i18n.t('last_name')"
                [placeholder]="i18n.t('last_name_placeholder')"
                [error]="errorOf(identity.lastName)"
              />
            </div>

            <bb-text-field
              [formField]="identity.email"
              type="email"
              autocomplete="email"
              [label]="i18n.t('email')"
              [placeholder]="i18n.t('email_placeholder')"
              [hint]="i18n.t('email_change_note')"
              [error]="errorOf(identity.email)"
            />

            <bb-button
              type="submit"
              [text]="savingIdentity() ? i18n.t('saving') : i18n.t('save_changes')"
              [disabled]="savingIdentity()"
            >
              <bb-icon slot="right" name="save" [size]="20" />
            </bb-button>
          </form>
        </section>

        <section class="bb-card">
          <h2 class="bb-card-title">
            <bb-icon name="map-pin" [size]="20" />
            {{ i18n.t('public_profile_card') }}
          </h2>
          <p class="bb-body-3 sub">{{ i18n.t('public_profile_lede') }}</p>

          <form (submit)="saveProfile($event)">
            <div class="row">
              <bb-text-field
                [(value)]="phone"
                type="tel"
                autocomplete="tel"
                [label]="i18n.t('phone_number')"
                [placeholder]="i18n.t('phone_number_placeholder')"
              />
              <bb-text-field
                [(value)]="location"
                autocomplete="address-level2"
                [label]="i18n.t('location')"
                [placeholder]="i18n.t('location_placeholder')"
              />
            </div>

            <bb-text-field
              [(value)]="bio"
              [label]="i18n.t('bio')"
              [placeholder]="i18n.t('bio_placeholder')"
              [multiline]="true"
              [rows]="5"
            />

            <bb-button
              type="submit"
              [text]="savingProfile() ? i18n.t('saving') : i18n.t('save_changes')"
              [disabled]="savingProfile()"
            >
              <bb-icon slot="right" name="save" [size]="20" />
            </bb-button>
          </form>
        </section>

        <section class="bb-card">
          <h2 class="bb-card-title">
            <bb-icon name="lock" [size]="20" />
            {{ i18n.t('change_password') }}
          </h2>

          <form (submit)="savePassword($event)">
            @if (passwordFailure(); as message) {
              <p class="alert" role="alert">
                <bb-icon name="circle-alert" [size]="20" />
                {{ message }}
              </p>
            }

            <bb-text-field
              [formField]="passwords.currentPassword"
              type="password"
              autocomplete="current-password"
              [revealable]="true"
              [label]="i18n.t('current_password')"
              [error]="errorOf(passwords.currentPassword)"
            />

            <div class="row">
              <bb-text-field
                [formField]="passwords.newPassword"
                type="password"
                autocomplete="new-password"
                [revealable]="true"
                [label]="i18n.t('new_password')"
                [hint]="i18n.t('password_hint')"
                [error]="errorOf(passwords.newPassword)"
              />
              <bb-text-field
                [formField]="passwords.confirmPassword"
                type="password"
                autocomplete="new-password"
                [revealable]="true"
                [label]="i18n.t('confirm_new_password')"
                [error]="confirmError()"
              />
            </div>

            <bb-button
              type="submit"
              [text]="savingPassword() ? i18n.t('saving') : i18n.t('update_password')"
              [disabled]="savingPassword()"
            >
              <bb-icon slot="right" name="shield" [size]="20" />
            </bb-button>
          </form>
        </section>
      </div>

      <aside class="side bb-rail-sticky">
        <section class="bb-card preview">
          <h2 class="bb-card-title">{{ i18n.t('what_others_see') }}</h2>

          <bb-avatar [initials]="initials()" [size]="64" />
          <p class="bb-title-md name">{{ fullName() }}</p>

          <bb-badge
            [text]="user()?.email_verified ? i18n.t('verified') : i18n.t('not_verified')"
            [background]="user()?.email_verified ? 'var(--bb-green-a10)' : 'var(--bb-red-a10)'"
            [color]="user()?.email_verified ? 'var(--bb-success)' : 'var(--bb-error)'"
          >
            <bb-icon name="shield" [size]="16" />
          </bb-badge>

          @if (location()) {
            <p class="bb-body-2 line">
              <bb-icon name="map-pin" [size]="16" />
              {{ location() }}
            </p>
          }

          @if (bio()) {
            <p class="bb-body-2 bio">{{ bio() }}</p>
          }
        </section>
      </aside>
    </div>
  `,
  styles: `
    .content {
      padding-top: 24px;
      padding-bottom: 48px;
    }

    .main {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .bb-card h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 4px;
      color: var(--bb-primary);
    }

    .sub {
      margin: 0 0 16px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }

    .row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    /* Les envois n'ont pas besoin de toute la largeur de la carte : on les
       laisse a la largeur de leur libelle, qui varie avec la langue. */
    form bb-button {
      width: auto;
      align-self: flex-start;
      margin-top: 4px;
      white-space: nowrap;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      padding: 12px 14px;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-red-a10);
      color: var(--bb-error);
      font-size: var(--bb-fs-body-2);
    }

    .alert bb-icon {
      flex: none;
    }

    .preview {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .preview h2 {
      color: var(--bb-title);
      margin-bottom: 4px;
    }

    .name,
    .line,
    .bio {
      margin: 0;
    }

    .line {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--bb-text);
    }

    .bio {
      white-space: pre-line;
    }
  `,
})
export class AccountPage {
  protected readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.userInfo;

  protected readonly savingIdentity = signal(false);
  protected readonly savingProfile = signal(false);
  protected readonly savingPassword = signal(false);
  protected readonly identityFailure = signal<string | null>(null);
  protected readonly passwordFailure = signal<string | null>(null);

  protected readonly identityModel = signal<IdentityForm>({
    firstName: this.user()?.given_name ?? '',
    lastName: this.user()?.family_name ?? '',
    email: this.user()?.email ?? '',
  });

  protected readonly identity = form(this.identityModel, (path) => {
    required(path.firstName, { message: this.i18n.t('error_first_name_required') });
    required(path.lastName, { message: this.i18n.t('error_last_name_required') });
    required(path.email, { message: this.i18n.t('error_email_required') });
    email(path.email, { message: this.i18n.t('error_email_invalid') });
  });

  /**
   * Le profil applicatif n'a aucune contrainte a annoncer : trois champs libres,
   * donc trois signaux, sans le detour d'un formulaire valide.
   */
  protected readonly phone = signal<string | number>(this.user()?.phone ?? '');
  protected readonly location = signal<string | number>(this.user()?.location ?? '');
  protected readonly bio = signal<string | number>(this.user()?.bio ?? '');

  protected readonly passwordModel = signal<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  protected readonly passwords = form(this.passwordModel, (path) => {
    required(path.currentPassword, { message: this.i18n.t('error_password_required') });
    required(path.newPassword, { message: this.i18n.t('error_password_required') });
    minLength(path.newPassword, 8, { message: this.i18n.t('error_password_too_short') });
    required(path.confirmPassword, { message: this.i18n.t('error_password_required') });
  });

  protected readonly initials = computed(() => {
    const { firstName, lastName } = this.identityModel();
    const letters = `${firstName.trim()[0] ?? ''}${lastName.trim()[0] ?? ''}`;
    return letters ? letters.toUpperCase() : '?';
  });

  protected readonly fullName = computed(() => {
    const { firstName, lastName } = this.identityModel();
    return `${firstName} ${lastName}`.trim() || (this.user()?.name ?? '');
  });

  /** La confirmation ne peut pas etre validee seule : elle depend de l'autre champ. */
  protected readonly confirmError = computed(() => {
    const { newPassword, confirmPassword } = this.passwordModel();
    if (confirmPassword && newPassword !== confirmPassword) {
      return this.i18n.t('error_password_mismatch');
    }
    return this.errorOf(this.passwords.confirmPassword);
  });

  protected errorOf(field: FieldTree<unknown>): string | null {
    const state = field();
    if (!state.touched()) return null;
    return state.errors()[0]?.message ?? null;
  }

  /**
   * Keycloak reste la source de verite : apres la mise a jour on redemande un
   * jeton, sinon les claims (nom, email) resteraient ceux d'avant.
   */
  protected async saveIdentity(event: Event): Promise<void> {
    event.preventDefault();
    const state = this.identity();
    state.markAsTouched();
    if (!state.valid() || this.savingIdentity()) return;

    const values = this.identityModel();
    this.identityFailure.set(null);
    this.savingIdentity.set(true);
    try {
      await firstValueFrom(
        this.users.updateIdentity({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
        }),
      );
      await this.auth.refreshTokens();
      await this.auth.loadUserInfo();
      this.confirm.inform(this.i18n.t('success'), this.i18n.t('identity_updated'));
    } catch (cause) {
      this.identityFailure.set(this.messageFor(cause));
    } finally {
      this.savingIdentity.set(false);
    }
  }

  protected async saveProfile(event: Event): Promise<void> {
    event.preventDefault();
    if (this.savingProfile()) return;

    this.savingProfile.set(true);
    try {
      await firstValueFrom(
        this.users.updateMe({
          phone: String(this.phone()).trim(),
          location: String(this.location()).trim(),
          bio: String(this.bio()).trim(),
        }),
      );
      await this.auth.loadUserInfo();
      this.confirm.inform(this.i18n.t('success'), this.i18n.t('profile_updated'));
    } catch {
      this.confirm.inform(this.i18n.t('error'), this.i18n.t('error_auth_unavailable'));
    } finally {
      this.savingProfile.set(false);
    }
  }

  protected async savePassword(event: Event): Promise<void> {
    event.preventDefault();
    const state = this.passwords();
    state.markAsTouched();
    const values = this.passwordModel();
    if (!state.valid() || values.newPassword !== values.confirmPassword || this.savingPassword()) {
      return;
    }

    this.passwordFailure.set(null);
    this.savingPassword.set(true);
    try {
      await firstValueFrom(this.users.changePassword(values.currentPassword, values.newPassword));
      this.passwordModel.set({ currentPassword: '', newPassword: '', confirmPassword: '' });
      this.passwords().reset();
      this.confirm.inform(this.i18n.t('success'), this.i18n.t('password_updated'));
    } catch (cause) {
      this.passwordFailure.set(this.messageFor(cause));
    } finally {
      this.savingPassword.set(false);
    }
  }

  /** Le code metier se lit maintenant dans `errors[0].extensions.code`. */
  private messageFor(cause: unknown): string {
    const code = cause instanceof GraphQlError ? cause.code : undefined;
    if (code === 'email_already_used') return this.i18n.t('error_email_already_used');
    if (code === 'invalid_current_password') return this.i18n.t('error_invalid_current_password');
    if (code === 'password_rejected') return this.i18n.t('error_password_rejected');
    return this.i18n.t('error_auth_unavailable');
  }

  protected goBack(): void {
    history.length > 1 ? history.back() : void this.router.navigate(['/profile']);
  }
}
