import { Component, inject, input, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { IconButton } from './icon-button';

/**
 * Partager une page : la feuille de partage native quand le navigateur en a une
 * (telephone), sinon le lien copie. Le libelle ne change pas ; la confirmation
 * « lien copie » est annoncee dans une region polie.
 *
 * Le lien mene a une page reservee aux membres : le destinataire se connecte,
 * puis `returnUrl` le ramene dessus.
 */
@Component({
  selector: 'bb-share-button',
  imports: [IconButton],
  template: `
    <bb-icon-button
      data-variant="ghost"
      icon="share-2"
      [label]="i18n.t('share')"
      (pressed)="share()"
    />
    <span class="sr-only" aria-live="polite">{{ copied() ? i18n.t('link_copied') : '' }}</span>
    @if (copied()) {
      <span class="toast bb-body-3" aria-hidden="true">{{ i18n.t('link_copied') }}</span>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-flex;
    }

    .toast {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      padding: 6px 10px;
      border-radius: var(--bb-radius-sm);
      background: var(--bb-title);
      color: var(--bb-card);
      white-space: nowrap;
    }
  `,
})
export class ShareButton {
  protected readonly i18n = inject(I18nService);

  readonly title = input('');
  /** Chemin a partager ; la page courante par defaut. */
  readonly path = input<string | null>(null);

  protected readonly copied = signal(false);

  protected async share(): Promise<void> {
    const url = new URL(
      this.path() ?? window.location.pathname + window.location.search,
      window.location.origin,
    ).href;
    if (navigator.share) {
      try {
        await navigator.share({ title: this.title(), url });
        return;
      } catch (cause) {
        // Partage annule par l'utilisateur : rien a faire. Autre echec : on copie.
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    } catch {
      // Presse-papiers refuse : le lien reste dans la barre d'adresse.
    }
  }
}
