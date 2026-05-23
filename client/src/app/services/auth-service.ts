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

  constructor() {}

  login(email: string, password: string) {
    return this.http
      .post('http://localhost:3001/login', {
        email,
        password,
      })
      .pipe(
        tap({
          next: (value: any) => {
            this.setUser(value.user);
            this.setToken(value.accessToken);
            // this.router.navigate(['/profile']);
          },
          error: () => {
            this.setUser(null);
            this.setToken(null);
          },
        }),
        shareReplay(1),
      );
  }

  setUser(user: User | null) {
    if (!user) {
      this.user.set(null);
      return;
    }

    this.user.set(user);
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
      error: () => this.setUser(null),
    });
  }

  loadUser() {
    this.http
      .get<any>('http://localhost:3001/session')
      .pipe(tap((data) => console.log(data)))
      .subscribe(
        // { error(err) {}, next(res) {} },
        ({ user }: { user: User }) => {
          if (!user) {
            this.setUser(null);
          } else {
            this.setUser(user);
          }
        },
      );
  }

  logout() {
    return this.http.post('http://localhost:3001/logout', {}).pipe(
      finalize(() => {
        this.setToken(null);
        this.setUser(null);
        this.router.navigate(['/login']);
      }),
    );
  }

  register(
    email: string,
    username: string,
    password: string,
    avatar: File | null,
  ) {
    const formData = new FormData();

    formData.append('email', email);
    formData.append('username', username);
    formData.append('password', password);
    if (avatar) {
      formData.append('avatar', avatar, avatar.name);
    }

    return this.http.post('http://localhost:3001/register', formData).pipe(
      tap({
        next: (value: any) => {
          this.setUser(value.user);
          this.setToken(value.accessToken);
        },
        error: () => {
          this.setUser(null);
          this.setToken(null);
        },
      }),
      shareReplay(1),
    );
  }

  isAuthenticated() {
    return this.user() ? true : false;
  }

  private userId = 1;
  public changeUser() {
    // this.userId++;
    // if (this.userId > 2) this.userId = 1;
    // this.http
    //   .get<any>(`http://localhost:3001/user/${this.userId}`)
    //   .pipe(tap((data) => console.log(data)))
    //   .subscribe(({ user: { user_id: id, username, email } }) => {
    //     this.user.set({ id, username, email });
    //   });
  }
}
