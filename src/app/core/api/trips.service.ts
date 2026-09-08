import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Listing } from '../models';

/** Route /trips/** de l'API gateway -> tripservice. */
@Service()
export class TripsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/trips`;

  active(): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.base}/active`);
  }

  byUser(sub: string): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.base}/user/${sub}`);
  }

  byId(id: string): Observable<Listing> {
    return this.http.get<Listing>(`${this.base}/${id}`);
  }

  create(payload: Partial<Listing>): Observable<Listing> {
    return this.http.post<Listing>(this.base, payload);
  }

  update(id: string, payload: Partial<Listing>): Observable<Listing> {
    return this.http.put<Listing>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
