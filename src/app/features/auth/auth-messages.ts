import { AuthError } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';

/**
 * Message a montrer pour un echec d'authentification. Partage par la connexion
 * et l'inscription, qui enchaine sur la meme connexion.
 */
export function messageForAuthError(i18n: I18nService, cause: unknown): string {
  const code = cause instanceof AuthError ? cause.code : 'unavailable';
  if (code === 'invalid_credentials') return i18n.t('error_invalid_credentials');
  if (code === 'account_disabled') return i18n.t('error_account_disabled');
  return i18n.t('error_auth_unavailable');
}
