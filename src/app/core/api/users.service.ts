import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PublicUserProfile, UserProfile } from '../models';

/**
 * Route /users/** de l'API gateway -> userservice.
 *
 * Keycloak reste la source de verite de l'identite (email, nom, mot de passe) ;
 * ce service porte ce que Keycloak ne connait pas : bio, localisation,
 * telephone, compte Stripe. Le profil est cree tout seul au premier appel a
 * me(), a partir des claims du token.
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
}
