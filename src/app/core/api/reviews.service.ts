import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Review } from '../models';

/** Route /reviews/** de l'API gateway -> reviewservice. */
@Service()
export class ReviewsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reviews`;

  forReviewee(sub: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/reviewee/${sub}`);
  }

  averageForReviewee(sub: string): Observable<number> {
    return this.http.get<number>(`${this.base}/reviewee/${sub}/average`);
  }

  forTransaction(transactionId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/transaction/${transactionId}`);
  }

  create(payload: Partial<Review>): Observable<Review> {
    return this.http.post<Review>(this.base, payload);
  }

  update(id: string, payload: Partial<Review>): Observable<Review> {
    return this.http.put<Review>(`${this.base}/${id}`, payload);
  }
}
