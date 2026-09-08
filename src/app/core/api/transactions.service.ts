import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Transaction } from '../models';

/** Route /transactions/** de l'API gateway -> transactionservice. */
@Service()
export class TransactionsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/transactions`;

  byUser(sub: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.base}/user/${sub}`);
  }

  byId(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.base}/${id}`);
  }

  countForUser(sub: string): Observable<number> {
    return this.http.get<number>(`${this.base}/user/${sub}/count`);
  }

  totalSpent(sub: string): Observable<number> {
    return this.http.get<number>(`${this.base}/buyer/${sub}/total-spent`);
  }

  totalEarned(sub: string): Observable<number> {
    return this.http.get<number>(`${this.base}/seller/${sub}/total-earned`);
  }

  create(payload: Partial<Transaction>): Observable<Transaction> {
    return this.http.post<Transaction>(this.base, payload);
  }

  update(id: string, payload: Partial<Transaction>): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.base}/${id}`, payload);
  }
}
