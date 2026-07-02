import { inject, Injectable, signal } from '@angular/core';
import { User } from '../models/User';
import { finalize, shareReplay, tap } from 'rxjs';
import { Router } from '@angular/router';
import { APIService } from './apiservice';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiService = inject(APIService);
  private router = inject(Router);

  user = signal<User | undefined | null>(undefined);
  token = signal<string | undefined | null>(undefined);

  constructor() {}

  login(email: string, password: string) {
    return this.apiService
      .post('login', {
        email,
        password,
      })
      .pipe(
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
    return this.apiService.get('refresh-token').pipe(
      tap((res: any) => {
        // console.log('REFRESHED TOKEN: ', res.accessToken);
        this.setToken(res.accessToken);
      }),
      shareReplay(1),
    );
  }

  initSession() {
    this.refreshToken().subscribe({
      next: () => this.loadUser(),
      error: () => {
        (this.setUser(null), this.setToken(null));
      },
    });
  }

  loadUser() {
    this.apiService
      .get<any>('session')
      // .pipe(tap((data) => console.log(data)))
      .subscribe(({ user }: { user: User }) => {
        if (!user) {
          this.setUser(null);
        } else {
          this.setUser(user);
        }
      });
  }

  logout() {
    return this.apiService.post('logout', {}).pipe(
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

    return this.apiService.post('register', formData).pipe(
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

  updateAvatar(avatar: File) {
    const formData = new FormData();
    formData.append('avatar', avatar, avatar.name);

    return this.apiService
      .post<{ data: { id: number; avatar: string } }>('update-avatar', formData)
      .pipe(
        tap({
          next: ({ data }) => {
            const newAvatarUrl = data.avatar;

            this.user.update((u) => {
              if (!u) return u;
              return { ...u, avatar: newAvatarUrl };
            });
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  isAuthenticated() {
    return this.user() !== null && this.user() !== undefined;
  }
}
