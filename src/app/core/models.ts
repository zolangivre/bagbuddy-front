/**
 * Formes de donnees renvoyees par le backend (tripservice / transactionservice /
 * reviewservice). Elles suivent les entites JPA cote back : les infos
 * utilisateur et annonce sont dupliquees dans chaque enregistrement plutot que
 * jointes.
 */

/**
 * Claims OIDC de Keycloak (`/protocol/openid-connect/userinfo`), tels que les
 * expose `AuthService.userInfo()`. Ils restent en **snake_case** : c'est le
 * standard OpenID, et il ne suit pas la convention camelCase de GraphQL.
 *
 * `bio`, `location` et `phone` n'en font pas partie : ils viennent de
 * userservice, fusionnes dans le meme signal par `loadUserInfo()`.
 */
export interface TokenClaims {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  phone?: string;
  bio?: string;
  location?: string;
}

/**
 * Instantane utilisateur recopie par l'API dans une annonce ou une transaction
 * (`Trip.userInfo`, `Transaction.buyerInfo`, `ListingInfo.sellerUserInfo`).
 * Contrairement aux claims ci-dessus, il est en **camelCase** : c'est le schema
 * GraphQL qui le sert.
 *
 * `email` et `phone` ne sont renseignes que pour qui a le droit de les voir
 * (proprietaire de l'annonce, participants d'une transaction).
 */
export interface UserInfoView {
  sub?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  username?: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  bio?: string;
  location?: string;
}

/**
 * Profil applicatif detenu par userservice, indexe sur le `sub` Keycloak.
 * Renvoye par la query `me` : les champs d'identite viennent du token Keycloak,
 * les champs libres (bio, location, phone, stripeAccountId) sont edites ici.
 */
export interface UserProfile {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  username?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  bio?: string;
  location?: string;
  phone?: string;
  stripeAccountId?: string;
}

/** Ce qu'un autre membre voit : ni email, ni telephone, ni compte Stripe. */
export type PublicUserProfile = Pick<
  UserProfile,
  'sub' | 'username' | 'name' | 'givenName' | 'emailVerified' | 'bio' | 'location'
>;

/** Une annonce = un vol avec des kilos disponibles (tripservice). */
export interface Listing {
  id?: string;
  userId?: string;
  userInfo: UserInfoView;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  arrivalDate: string;
  totalWeightAvailable: number;
  remainingWeight: number;
  pricePerKg: number;
  conditions?: string;
  active?: boolean;
  createdAt?: string;
  /** Renseigne uniquement pour le proprietaire de l'annonce. */
  stripeAccountId?: string;
}

/** Snapshot d'annonce embarque dans une transaction. */
export interface ListingInfo extends Omit<Listing, 'userInfo' | 'userId'> {
  sellerUserInfo?: UserInfoView;
  userInfo?: UserInfoView;
}

export interface Transaction {
  id?: string;
  listingId?: string;
  listingInfo: ListingInfo;
  sellerId: string;
  buyerId: string;
  buyerInfo?: UserInfoView;
  weight: number;
  total: number;
  sellerStatus: string;
  buyerStatus: string;
  sellerReview?: boolean;
  buyerReview?: boolean;
  stripePaymentIntentId?: string;
  stripeCurrency?: string;
  stripeAmount?: number;
  paidAt?: string;
  createdAt?: string;
}

export interface Review {
  id?: string;
  transactionId?: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName?: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export type Role = 'buyer' | 'seller';

export interface ListingFilters {
  from?: string;
  to?: string;
  minPrice?: number;
  maxPrice?: number;
  minWeight?: number;
  maxWeight?: number;
  status?: string | null;
  sort?: SortOption | null;
}

export type SortOption =
  'recent' | 'earliest_departure' | 'price_low' | 'price_high' | 'weight_high' | 'weight_low';
