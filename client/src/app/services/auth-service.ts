import { effect, inject, Injectable, signal } from '@angular/core';
import { User } from '../models/User';
import { finalize, Observable, shareReplay, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  user = signal<User | undefined | null>(undefined);
  token = signal<string | undefined | null>(undefined);

  constructor() {
    console.log('Loading user');
    // this.initSession();
    // effect(() => {
    //   // this.loadUser();
    // });
  }

  login(email: string, password: string) {
    return this.http
      .post('http://localhost:3001/login', { email, password })
      .pipe(shareReplay());
  }

  setUser(user: any | null) {
    if (!user) {
      this.user.set(null);
      return;
    }

    this.user.set({
      id: user.userId,
      email: user.username,
      username: user.username,
    });
  }

  setToken(token: string | null) {
    this.token.set(token);
  }

  refreshToken() {
    return this.http.get('http://localhost:3001/refresh-token').pipe(
      tap((res: any) => {
        console.log('REFRESHED TOKEN: ', res.accessToken);
        this.setToken(res.accessToken);
      }),
      shareReplay(1),
    );
  }

  initSession() {
    console.log('INIT SESSION');
    this.refreshToken().subscribe({
      next: () => this.loadUser(), // Una volta ottenuto il token, carichiamo l'utente
      error: () => this.user.set(null),
    });
  }

  loadUser() {
    this.http
      .get<any>('http://localhost:3001/session')
      .pipe(tap((data) => console.log(data)))
      .subscribe(
        // { error(err) {}, next(res) {} },
        ({ user }) => {
          if (!user) {
            this.user.set(null);
          } else {
            this.user.set({
              id: user.id,
              username: user.username,
              email: user.email,
            });
          }
        },
      );
  }

  logout() {
    this.http
      .post('http://localhost:3001/logout', {})
      .pipe(
        finalize(() => {
          this.token.set(null);
          this.user.set(null);
          this.router.navigate(['/login']);
        }),
      )
      .subscribe();
  }

  private userId = 1;
  public changeUser() {
    this.userId++;
    if (this.userId > 2) this.userId = 1;
    this.http
      .get<any>(`http://localhost:3001/user/${this.userId}`)
      .pipe(tap((data) => console.log(data)))
      .subscribe(({ user: { user_id: id, username, email } }) => {
        this.user.set({ id, username, email });
      });
  }
}
