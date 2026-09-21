import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Language } from '../i18n/i18n.service';
import { PublicUserProfile, UserProfile } from '../models';
import { GraphQlClient } from './graphql.client';

/** Inscription : l'email sert aussi d'identifiant de connexion. */
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** Champs d'identite detenus par Keycloak. */
export interface IdentityPayload {
  firstName: string;
  lastName: string;
  email: string;
  /**
   * Exige par le back des que l'email change, puisqu'il sert aussi a se
   * connecter : absent ou faux, la mutation echoue en
   * `invalid_current_password`. Inutile pour un changement de nom seul.
   */
  currentPassword?: string;
}

/**
 * Codes d'erreur renvoyes par userservice dans `errors[0].extensions.code`
 * (c'etait le champ `code` du ProblemDetail avant GraphQL). C'est le code qui
 * fait contrat, pas le libelle : les ecrans matchent dessus.
 */
export type AccountErrorCode =
  | 'email_already_used'
  | 'invalid_current_password'
  | 'password_rejected'
  | 'invalid_reset_token'
  | 'verification_email_throttled'
  | 'invalid_verification_token'
  | 'too_many_favorites'
  | 'cannot_report_self'
  | 'too_many_reports';

/** Motifs de signalement, memes valeurs que l'enum `ReportReason` du schema. */
export type ReportReason = 'PROHIBITED_ITEMS' | 'NO_SHOW' | 'FRAUD' | 'HARASSMENT' | 'OTHER';

export interface ReportMemberPayload {
  reportedSub: string;
  transactionId?: string;
  reason: ReportReason;
  details?: string;
}

const PROFILE_FIELDS = `
  sub email emailVerified username name givenName familyName bio location phone stripeAccountId
`;

/**
 * Schema GraphQL de userservice, servi sur /users/graphql.
 *
 * Deux natures de donnees derriere le meme schema : le profil applicatif (bio,
 * localisation, telephone, compte Stripe), porte par userservice, et l'identite
 * (nom, email, mot de passe), qui reste a Keycloak — userservice ne fait que
 * relayer ces trois-la vers l'API d'administration, pour le compte de
 * l'appelant. Le profil est cree tout seul au premier appel a me(), a partir des
 * claims du token.
 *
 * /users/graphql est le seul endpoint GraphQL ouvert sans jeton, parce que
 * `register`, `requestPasswordReset`, `resetPassword` et `verifyEmail` vivent
 * dans ce meme schema ; toutes les autres operations exigent un jeton et
 * repondent UNAUTHORIZED sans lui.
 */
@Service()
export class UsersService {
  private readonly gql = inject(GraphQlClient);

  /** Profil complet de l'utilisateur connecte (coordonnees comprises). */
  me(): Observable<UserProfile> {
    return this.gql
      .request<{ me: UserProfile }>('users', `query { me { ${PROFILE_FIELDS} } }`)
      .pipe(map((data) => data.me));
  }

  /**
   * Seuls bio, location et phone sont modifiables ici. Le compte de versement
   * n'est plus saisi par le membre : stripeservice l'enregistre pendant
   * l'onboarding Stripe Connect, et l'envoyer serait une ValidationError.
   */
  updateMe(payload: Partial<UserProfile>): Observable<UserProfile> {
    return this.gql
      .request<{ updateProfile: UserProfile }>(
        'users',
        `mutation($input: UpdateProfileInput!) { updateProfile(input: $input) { ${PROFILE_FIELDS} } }`,
        {
          input: {
            bio: payload.bio,
            location: payload.location,
            phone: payload.phone,
          },
        },
      )
      .pipe(map((data) => data.updateProfile));
  }

  /**
   * Profil public d'un autre membre. `PublicUserProfile` ne porte ni email, ni
   * telephone, ni compte Stripe : les demander n'est plus un champ absent mais
   * une ValidationError, donc pas de PROFILE_FIELDS ici. `username` reste dans
   * le schema mais revient nul pour tout autre que l'appelant : inutile de le
   * demander.
   */
  publicProfile(sub: string): Observable<PublicUserProfile> {
    return this.gql
      .request<{ user: PublicUserProfile }>(
        'users',
        `query($sub: String!) { user(sub: $sub) { sub name givenName emailVerified bio location } }`,
        { sub },
      )
      .pipe(map((data) => data.user));
  }

  /**
   * Cree le compte Keycloak. Sans jeton, comme les deux appels du mot de passe
   * oublie.
   * Renvoie desormais le booleen de la mutation, la ou le POST ne rendait rien.
   */
  register(payload: RegisterPayload): Observable<boolean> {
    return this.gql
      .request<{ register: boolean }>(
        'users',
        `mutation($input: RegisterInput!) { register(input: $input) }`,
        {
          input: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            password: payload.password,
          },
        },
      )
      .pipe(map((data) => data.register));
  }

  /**
   * Nom et email. Un changement d'email remet la verification a zero cote
   * Keycloak, et perime les claims du jeton courant : appeler
   * `AuthService.refreshTokens()` dans la foulee.
   *
   * `currentPassword` n'est transmis que s'il est renseigne : le schema
   * l'accepte nul, et le back ne le reclame que si l'email change.
   */
  updateIdentity(payload: IdentityPayload): Observable<UserProfile> {
    return this.gql
      .request<{ updateIdentity: UserProfile }>(
        'users',
        `mutation($input: UpdateIdentityInput!) { updateIdentity(input: $input) { ${PROFILE_FIELDS} } }`,
        {
          input: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            ...(payload.currentPassword ? { currentPassword: payload.currentPassword } : {}),
          },
        },
      )
      .pipe(map((data) => data.updateIdentity));
  }

  /**
   * Mot de passe oublie, sans jeton. Repond `true` que l'email corresponde a un
   * compte ou non : l'ecran ne peut donc pas dire « aucun compte », et ne doit
   * pas essayer. Le lien envoye mene a `/reset-password#<jeton>`, dans la langue
   * passee ici.
   */
  requestPasswordReset(email: string, language: Language): Observable<boolean> {
    return this.gql
      .request<{ requestPasswordReset: boolean }>(
        'users',
        `mutation($input: RequestPasswordResetInput!) { requestPasswordReset(input: $input) }`,
        { input: { email, language } },
      )
      .pipe(map((data) => data.requestPasswordReset));
  }

  /**
   * Pose le nouveau mot de passe a partir du jeton du lien, sans jeton d'acces.
   * Le back ferme ensuite toutes les sessions du compte. Echecs attendus :
   * `invalid_reset_token` (lien expire, deja utilise ou remplace) et
   * `password_rejected` (politique du realm).
   */
  resetPassword(token: string, newPassword: string): Observable<boolean> {
    return this.gql
      .request<{ resetPassword: boolean }>(
        'users',
        `mutation($input: ResetPasswordInput!) { resetPassword(input: $input) }`,
        { input: { token, newPassword } },
      )
      .pipe(map((data) => data.resetPassword));
  }

  /**
   * Envoie un lien de verification a l'adresse actuelle du compte connecte (lue
   * chez Keycloak, donc deja la nouvelle juste apres un changement d'email).
   * `false` si elle est deja verifiee. Au plus un envoi par minute :
   * `verification_email_throttled` au-dela.
   */
  sendVerificationEmail(language: Language): Observable<boolean> {
    return this.gql
      .request<{ sendVerificationEmail: boolean }>(
        'users',
        `mutation($language: String) { sendVerificationEmail(language: $language) }`,
        { language },
      )
      .pipe(map((data) => data.sendVerificationEmail));
  }

  /**
   * Confirme l'adresse a partir du jeton du lien, sans jeton d'acces : le lien
   * s'ouvre souvent sur un autre appareil. Echec attendu :
   * `invalid_verification_token`.
   */
  verifyEmail(token: string): Observable<boolean> {
    return this.gql
      .request<{ verifyEmail: boolean }>(
        'users',
        `mutation($token: String!) { verifyEmail(token: $token) }`,
        { token },
      )
      .pipe(map((data) => data.verifyEmail));
  }

  /** Annonces mises de cote par l'appelant, les plus recentes d'abord (identifiants seuls). */
  favoriteListingIds(): Observable<string[]> {
    return this.gql
      .request<{ favoriteListingIds: string[] }>('users', `query { favoriteListingIds }`)
      .pipe(map((data) => data.favoriteListingIds.map(String)));
  }

  /** Idempotent. `too_many_favorites` au-dela de 200. */
  addFavoriteListing(listingId: string): Observable<boolean> {
    return this.gql
      .request<{ addFavoriteListing: boolean }>(
        'users',
        `mutation($listingId: ID!) { addFavoriteListing(listingId: $listingId) }`,
        { listingId },
      )
      .pipe(map((data) => data.addFavoriteListing));
  }

  /** Idempotent : retirer une annonce absente n'est pas une erreur. */
  removeFavoriteListing(listingId: string): Observable<boolean> {
    return this.gql
      .request<{ removeFavoriteListing: boolean }>(
        'users',
        `mutation($listingId: ID!) { removeFavoriteListing(listingId: $listingId) }`,
        { listingId },
      )
      .pipe(map((data) => data.removeFavoriteListing));
  }

  /**
   * Signale un membre a la moderation. L'auteur est l'appelant (jeton). Codes :
   * `cannot_report_self`, `too_many_reports` (10 par 24 h).
   */
  reportMember(payload: ReportMemberPayload): Observable<boolean> {
    return this.gql
      .request<{ reportMember: boolean }>(
        'users',
        `mutation($input: ReportMemberInput!) { reportMember(input: $input) }`,
        {
          input: {
            reportedSub: payload.reportedSub,
            transactionId: payload.transactionId,
            reason: payload.reason,
            details: payload.details,
          },
        },
      )
      .pipe(map((data) => data.reportMember));
  }

  /**
   * Le mot de passe actuel est reverifie cote Keycloak avant tout changement.
   * Renvoie desormais le booleen de la mutation, la ou le PUT ne rendait rien.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    return this.gql
      .request<{ changePassword: boolean }>(
        'users',
        `mutation($input: ChangePasswordInput!) { changePassword(input: $input) }`,
        { input: { currentPassword, newPassword } },
      )
      .pipe(map((data) => data.changePassword));
  }
}
