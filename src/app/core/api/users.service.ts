import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PublicUserProfile, UserProfile } from '../models';

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
 * Codes d'erreur renvoyes par userservice dans le champ `code` du ProblemDetail.
 * C'est le code qui fait contrat, pas le libelle : les ecrans matchent dessus.
 */
export type AccountErrorCode =
  'email_already_used' | 'invalid_current_password' | 'password_rejected';

/**
 * Route /users/** de l'API gateway -> userservice.
 *
 * Deux natures de donnees derriere la meme route : le profil applicatif (bio,
 * localisation, telephone, compte Stripe), porte par userservice, et l'identite
 * (nom, email, mot de passe), qui reste a Keycloak — userservice ne fait que
 * relayer ces trois-la vers l'API d'administration, pour le compte de
 * l'appelant. Le profil est cree tout seul au premier appel a me(), a partir des
 * claims du token.
 */
@Service()
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  /** Profil complet de l'utilisateur connecte (coordonnees comprises). */
  me(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/me`);
  }

  /** Seuls bio, location, phone et stripeAccountId sont modifiables ici. */
  updateMe(payload: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/me`, {
      bio: payload.bio,
      location: payload.location,
      phone: payload.phone,
      stripeAccountId: payload.stripeAccountId,
    });
  }

  /** Profil public d'un autre membre : sans email, telephone ni compte Stripe. */
  publicProfile(sub: string): Observable<PublicUserProfile> {
    return this.http.get<PublicUserProfile>(`${this.base}/${sub}`);
  }

  /** Cree le compte Keycloak. Seul appel de l'app qui ne porte pas de jeton. */
  register(payload: RegisterPayload): Observable<void> {
    return this.http.post<void>(`${this.base}/register`, payload);
  }

  /**
   * Nom et email. Un changement d'email remet la verification a zero cote
   * Keycloak, et perime les claims du jeton courant : appeler
   * `AuthService.refreshTokens()` dans la foulee.
   */
  updateIdentity(payload: IdentityPayload): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/me/identity`, payload);
  }

  /** Le mot de passe actuel est reverifie cote Keycloak avant tout changement. */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.base}/me/password`, { currentPassword, newPassword });
  }
}
