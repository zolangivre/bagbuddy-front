import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
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
}

/**
 * Codes d'erreur renvoyes par userservice dans `errors[0].extensions.code`
 * (c'etait le champ `code` du ProblemDetail avant GraphQL). C'est le code qui
 * fait contrat, pas le libelle : les ecrans matchent dessus.
 */
export type AccountErrorCode =
  'email_already_used' | 'invalid_current_password' | 'password_rejected';

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
 * `register` vit dans ce meme schema ; toutes les autres operations exigent un
 * jeton et repondent UNAUTHORIZED sans lui.
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

  /** Seuls bio, location, phone et stripeAccountId sont modifiables ici. */
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
            stripeAccountId: payload.stripeAccountId,
          },
        },
      )
      .pipe(map((data) => data.updateProfile));
  }

  /**
   * Profil public d'un autre membre. `PublicUserProfile` ne porte ni email, ni
   * telephone, ni compte Stripe : les demander n'est plus un champ absent mais
   * une ValidationError, donc pas de PROFILE_FIELDS ici.
   */
  publicProfile(sub: string): Observable<PublicUserProfile> {
    return this.gql
      .request<{ user: PublicUserProfile }>(
        'users',
        `query($sub: String!) { user(sub: $sub) { sub username name givenName emailVerified bio location } }`,
        { sub },
      )
      .pipe(map((data) => data.user));
  }

  /**
   * Cree le compte Keycloak. Seul appel de l'app qui ne porte pas de jeton.
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
          },
        },
      )
      .pipe(map((data) => data.updateIdentity));
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
