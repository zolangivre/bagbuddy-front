import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Listing } from '../models';
import { GraphQlClient } from './graphql.client';

/** Selection complete d'une annonce : ce que les ecrans lisent aujourd'hui. */
const TRIP_FIELDS = `
  id userId departureAirport arrivalAirport departureDate arrivalDate
  totalWeightAvailable remainingWeight pricePerKg conditions active createdAt
  stripeAccountId
  userInfo { sub name givenName familyName username emailVerified bio location email phone }
`;

/**
 * Schema GraphQL de tripservice, servi sur /trips/graphql par la gateway.
 *
 * `TripInput` n'accepte ni `userId` ni `userInfo` : l'identite du voyageur vient
 * du jeton. Seuls les champs libres du profil (bio, localisation, telephone)
 * sont recopies dans l'instantane, via `profile`. Envoyer autre chose est refuse
 * par le schema (ValidationError), d'ou la construction explicite de l'input.
 */
@Service()
export class TripsService {
  private readonly gql = inject(GraphQlClient);

  active(): Observable<Listing[]> {
    return this.gql
      .request<{
        activeTrips: Listing[];
      }>('trips', `query { activeTrips { ${TRIP_FIELDS} } }`)
      .pipe(map((data) => data.activeTrips));
  }

  byUser(sub: string): Observable<Listing[]> {
    return this.gql
      .request<{ tripsByUser: Listing[] }>(
        'trips',
        `query($userId: String!) { tripsByUser(userId: $userId) { ${TRIP_FIELDS} } }`,
        { userId: sub },
      )
      .pipe(map((data) => data.tripsByUser));
  }

  byId(id: string): Observable<Listing> {
    return this.gql
      .request<{ trip: Listing }>('trips', `query($id: ID!) { trip(id: $id) { ${TRIP_FIELDS} } }`, {
        id,
      })
      .pipe(map((data) => data.trip));
  }

  create(payload: Partial<Listing>): Observable<Listing> {
    return this.gql
      .request<{ createTrip: Listing }>(
        'trips',
        `mutation($input: TripInput!) { createTrip(input: $input) { ${TRIP_FIELDS} } }`,
        { input: this.toInput(payload) },
      )
      .pipe(map((data) => data.createTrip));
  }

  update(id: string, payload: Partial<Listing>): Observable<Listing> {
    return this.gql
      .request<{ updateTrip: Listing }>(
        'trips',
        `mutation($id: ID!, $input: TripInput!) { updateTrip(id: $id, input: $input) { ${TRIP_FIELDS} } }`,
        { id, input: this.toInput(payload) },
      )
      .pipe(map((data) => data.updateTrip));
  }

  /** Renvoie desormais le booleen de `deleteTrip`, la ou DELETE ne rendait rien. */
  remove(id: string): Observable<boolean> {
    return this.gql
      .request<{ deleteTrip: boolean }>('trips', `mutation($id: ID!) { deleteTrip(id: $id) }`, {
        id,
      })
      .pipe(map((data) => data.deleteTrip));
  }

  /**
   * Compte de paiement du voyageur, lisible par son seul proprietaire.
   * Remplace GET /trips/user/{sub}/stripe-account.
   */
  payoutAccount(sub: string): Observable<string | null> {
    return this.gql
      .request<{ payoutAccount: string | null }>(
        'trips',
        `query($userId: String!) { payoutAccount(userId: $userId) }`,
        { userId: sub },
      )
      .pipe(map((data) => data.payoutAccount));
  }

  /** Le profil (bio / localisation / telephone) est le seul reste de `userInfo`. */
  private toInput(payload: Partial<Listing>) {
    const profile = payload.userInfo;
    return {
      departureAirport: payload.departureAirport,
      arrivalAirport: payload.arrivalAirport,
      departureDate: payload.departureDate,
      arrivalDate: payload.arrivalDate,
      totalWeightAvailable: payload.totalWeightAvailable,
      remainingWeight: payload.remainingWeight,
      pricePerKg: payload.pricePerKg,
      conditions: payload.conditions,
      stripeAccountId: payload.stripeAccountId,
      profile: profile
        ? { bio: profile.bio, location: profile.location, phone: profile.phone }
        : null,
    };
  }
}
