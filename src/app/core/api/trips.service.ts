import { inject, Service } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { Listing, ListingFilters, SortOption } from '../models';
import { GraphQlClient } from './graphql.client';

/** Selection complete d'une annonce : ce que les ecrans lisent aujourd'hui. */
const TRIP_FIELDS = `
  id userId departureAirport arrivalAirport departureDate arrivalDate
  totalWeightAvailable remainingWeight pricePerKg conditions active createdAt
  stripeAccountId
  userInfo { sub name givenName familyName emailVerified bio location email phone }
`;

/**
 * Schema GraphQL de tripservice, servi sur /trips/graphql par la gateway.
 *
 * `TripInput` n'accepte ni `userId` ni `userInfo` : l'identite du voyageur vient
 * du jeton. Seuls les champs libres du profil (bio, localisation, telephone)
 * sont recopies dans l'instantane, via `profile`. Envoyer autre chose est refuse
 * par le schema (ValidationError), d'ou la construction explicite de l'input.
 *
 * `remainingWeight` n'en fait pas partie non plus : la capacite restante est de
 * l'inventaire, decide par le serveur. A la creation elle vaut le total ; a la
 * modification elle suit la variation du total, bornee entre 0 et le nouveau
 * total. Le vendeur ne regle que `totalWeightAvailable`.
 */
/** Agregats d'un filtre, toutes pages confondues. */
export interface TripSearchOverview {
  totalCount: number;
  totalRemainingWeight: number;
  /** Null sans resultat. En devise de base : l'affichage convertit (CurrencyService). */
  averagePricePerKg: number | null;
}

/** Alerte de trajet : un email a chaque annonce publiee qui correspond. */
export interface TripAlert {
  id: string;
  departureAirport: string;
  arrivalAirport: string;
  /** YYYY-MM-DD, ou nul : toutes les dates. */
  date: string | null;
  flexDays: number;
  maxPricePerKg: number | null;
  minWeight: number | null;
  createdAt: string;
}

export interface TripSearchPage extends TripSearchOverview {
  items: Listing[];
}

const SORTS: Record<SortOption, string> = {
  recent: 'RECENT',
  earliest_departure: 'EARLIEST_DEPARTURE',
  price_low: 'PRICE_LOW',
  price_high: 'PRICE_HIGH',
  weight_high: 'WEIGHT_HIGH',
  weight_low: 'WEIGHT_LOW',
};

/**
 * `ListingFilters` (le vocabulaire des filtres du front) vers `TripSearchInput`.
 * Un champ absent ne filtre pas, cote serveur comme ici. Sans tri choisi, le
 * serveur rend les plus recentes d'abord, comme le faisait `activeTrips`.
 */
function toSearchInput(filters: ListingFilters) {
  return {
    departureAirport: filters.from,
    arrivalAirport: filters.to,
    date: filters.date,
    flexDays: filters.date ? filters.flexDays : undefined,
    minPricePerKg: filters.minPrice,
    maxPricePerKg: filters.maxPrice,
    minWeight: filters.minWeight,
    maxWeight: filters.maxWeight,
    sort: filters.sort ? SORTS[filters.sort] : undefined,
  };
}

@Service()
export class TripsService {
  private readonly gql = inject(GraphQlClient);

  /**
   * Annonces reservables, filtrees, triees et paginees par le serveur, avec le
   * nombre total de resultats et les agregats du filtre entier.
   *
   * `overview` (sans filtre) et `results` (filtre) partent dans le meme document,
   * sous deux alias : l'accueil y lit ses chiffres de bandeau et sa premiere page
   * en un seul POST. Les pages suivantes passent par `results` seul
   * (`withOverview: false`).
   */
  search(
    filters: ListingFilters,
    limit: number,
    offset: number,
    withOverview: boolean,
  ): Observable<{ overview: TripSearchOverview | null; results: TripSearchPage }> {
    const results = `results: searchTrips(filter: $filter, limit: $limit, offset: $offset) {
      totalCount totalRemainingWeight averagePricePerKg items { ${TRIP_FIELDS} }
    }`;
    const overview = `overview: searchTrips(limit: 1) {
      totalCount totalRemainingWeight averagePricePerKg
    }`;
    return this.gql
      .request<{ overview?: TripSearchOverview; results: TripSearchPage }>(
        'trips',
        `query($filter: TripSearchInput, $limit: Int, $offset: Int) {
          ${withOverview ? overview : ''}
          ${results}
        }`,
        { filter: toSearchInput(filters), limit, offset },
      )
      .pipe(map((data) => ({ overview: data.overview ?? null, results: data.results })));
  }

  /**
   * Annonces par identifiant (favoris), dans l'ordre demande. Une annonce
   * supprimee est simplement absente de la reponse. 200 identifiants au plus.
   */
  byIds(ids: readonly string[]): Observable<Listing[]> {
    if (!ids.length) return of([]);
    return this.gql
      .request<{ tripsByIds: Listing[] }>(
        'trips',
        `query($ids: [ID!]!) { tripsByIds(ids: $ids) { ${TRIP_FIELDS} } }`,
        { ids },
      )
      .pipe(map((data) => data.tripsByIds));
  }

  /** Alertes de l'appelant, les plus recentes d'abord. */
  myAlerts(): Observable<TripAlert[]> {
    return this.gql
      .request<{ myTripAlerts: TripAlert[] }>(
        'trips',
        `query { myTripAlerts { id departureAirport arrivalAirport date flexDays maxPricePerKg minWeight createdAt } }`,
      )
      .pipe(map((data) => data.myTripAlerts));
  }

  /**
   * Cree une alerte a partir des filtres de l'accueil : trajet obligatoire, le
   * reste facultatif. L'email est celui du jeton. Codes : `alert_needs_email`,
   * `alert_invalid_route`, `too_many_alerts` (10 par membre).
   */
  createAlert(filters: ListingFilters, language: string): Observable<TripAlert> {
    return this.gql
      .request<{ createTripAlert: TripAlert }>(
        'trips',
        `mutation($input: TripAlertInput!) {
          createTripAlert(input: $input) { id departureAirport arrivalAirport date flexDays maxPricePerKg minWeight createdAt }
        }`,
        {
          input: {
            departureAirport: filters.from,
            arrivalAirport: filters.to,
            date: filters.date,
            flexDays: filters.date ? filters.flexDays : undefined,
            maxPricePerKg: filters.maxPrice,
            minWeight: filters.minWeight,
            language,
          },
        },
      )
      .pipe(map((data) => data.createTripAlert));
  }

  /** Vrai si l'alerte existait et appartenait a l'appelant. */
  deleteAlert(id: string): Observable<boolean> {
    return this.gql
      .request<{ deleteTripAlert: boolean }>(
        'trips',
        `mutation($id: ID!) { deleteTripAlert(id: $id) }`,
        {
          id,
        },
      )
      .pipe(map((data) => data.deleteTripAlert));
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
      pricePerKg: payload.pricePerKg,
      conditions: payload.conditions,
      stripeAccountId: payload.stripeAccountId,
      profile: profile
        ? { bio: profile.bio, location: profile.location, phone: profile.phone }
        : null,
    };
  }
}
