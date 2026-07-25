import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class APIService {
  private http = inject(HttpClient);

  private baseURL = 'http://localhost:3001/api/v1/';

  get<T>(route: string): Observable<T> {
    return this.http.get<T>(`${this.baseURL}${route}`);
  }
  post<T>(route: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseURL}${route}`, body);
  }
  patch<T>(route: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.baseURL}${route}`, body);
  }
  delete<T>(route: string): Observable<T> {
    return this.http.delete<T>(`${this.baseURL}${route}`);
  }
}
