import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Review } from '../models';
import { GraphQlClient } from './graphql.client';

const REVIEW_FIELDS = `
  id transactionId reviewerId reviewerName revieweeId revieweeName rating comment createdAt
`;

export interface ReviewSummary {
  reviews: Review[];
  /** Null tant que le membre n'a recu aucun avis. */
  average: number | null;
}

/**
 * Schema GraphQL de reviewservice, servi sur /reviews/graphql.
 *
 * `CreateReviewInput` n'accepte ni `reviewerId` ni `revieweeId` : l'auteur vient
 * du jeton et le destinataire est l'autre partie de la transaction, resolus cote
 * serveur. C'est ce qui empeche de noter quelqu'un au hasard.
 */
@Service()
export class ReviewsService {
  private readonly gql = inject(GraphQlClient);

  forReviewee(sub: string): Observable<Review[]> {
    return this.gql
      .request<{ reviewsByReviewee: Review[] }>(
        'reviews',
        `query($revieweeId: String!) { reviewsByReviewee(revieweeId: $revieweeId) { ${REVIEW_FIELDS} } }`,
        { revieweeId: sub },
      )
      .pipe(map((data) => data.reviewsByReviewee));
  }

  /** Null tant que le membre n'a recu aucun avis, comme avant. */
  averageForReviewee(sub: string): Observable<number> {
    return this.gql
      .request<{ averageRating: number }>(
        'reviews',
        `query($revieweeId: String!) { averageRating(revieweeId: $revieweeId) }`,
        { revieweeId: sub },
      )
      .pipe(map((data) => data.averageRating));
  }

  /**
   * Avis recus et moyenne en une requete : le profil public affiche les deux, et
   * ils vivent dans le meme schema.
   */
  summaryForReviewee(sub: string): Observable<ReviewSummary> {
    return this.gql
      .request<{ reviewsByReviewee: Review[]; averageRating: number | null }>(
        'reviews',
        `query($revieweeId: String!) {
          reviewsByReviewee(revieweeId: $revieweeId) { ${REVIEW_FIELDS} }
          averageRating(revieweeId: $revieweeId)
        }`,
        { revieweeId: sub },
      )
      .pipe(map((data) => ({ reviews: data.reviewsByReviewee, average: data.averageRating })));
  }

  forTransaction(transactionId: string): Observable<Review[]> {
    return this.gql
      .request<{ reviewsByTransaction: Review[] }>(
        'reviews',
        `query($transactionId: ID!) { reviewsByTransaction(transactionId: $transactionId) { ${REVIEW_FIELDS} } }`,
        { transactionId },
      )
      .pipe(map((data) => data.reviewsByTransaction));
  }

  create(payload: Partial<Review>): Observable<Review> {
    return this.gql
      .request<{ createReview: Review }>(
        'reviews',
        `mutation($input: CreateReviewInput!) { createReview(input: $input) { ${REVIEW_FIELDS} } }`,
        {
          input: {
            transactionId: payload.transactionId,
            rating: payload.rating,
            comment: payload.comment,
          },
        },
      )
      .pipe(map((data) => data.createReview));
  }

  /** Seul le contenu est modifiable : jamais qui est note. */
  update(id: string, payload: Partial<Review>): Observable<Review> {
    return this.gql
      .request<{ updateReview: Review }>(
        'reviews',
        `mutation($id: ID!, $input: UpdateReviewInput!) { updateReview(id: $id, input: $input) { ${REVIEW_FIELDS} } }`,
        { id, input: { rating: payload.rating, comment: payload.comment } },
      )
      .pipe(map((data) => data.updateReview));
  }
}
