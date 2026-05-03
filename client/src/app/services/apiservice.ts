import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class APIService {
  private http = inject(HttpClient);

  private baseURL = 'http://localhost:3001/';

  get<T>(route: string): Observable<T> {
    return this.http.get<T>(`${this.baseURL}${route}`);
  }
  post(route: string, body: any): Observable<any> {
    return this.http.post(`${this.baseURL}${route}`, body);
  }
  patch(route: string, body: any): Observable<any> {
    return this.http.patch(`${this.baseURL}${route}`, body);
  }
  delete(route: string): Observable<any> {
    return this.http.delete(`${this.baseURL}${route}`);
  }
}
