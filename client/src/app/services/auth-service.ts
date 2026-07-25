import { inject, Injectable, signal } from '@angular/core';
import {
  AvatarUploadData,
  LoginResponse,
  RegisterResponse,
  User,
} from '../models/User';
import { finalize, shareReplay, tap } from 'rxjs';
import { Router } from '@angular/router';
import { APIService } from './apiservice';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiService = inject(APIService);
  private httpClient = inject(HttpClient);
  private router = inject(Router);

  user = signal<User | undefined | null>(undefined);
  token = signal<string | undefined | null>(undefined);

  constructor() {}

  login(email: string, password: string) {
    return this.apiService
      .post<LoginResponse>('auth/login', {
        email,
        password,
      })
      .pipe(
        tap({
          next: ({ data }) => {
            this.setUser(data.user);
            this.setToken(data.accessToken);
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
    return this.apiService
      .get<{ accessToken: string }>('auth/refresh-token')
      .pipe(
        tap((res) => {
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
      .get<{ user: User }>('auth/session')
      // .pipe(tap((data) => console.log(data)))
      .subscribe(({ user }) => {
        if (!user) {
          this.setUser(null);
        } else {
          this.setUser(user);
        }
      });
  }

  logout() {
    return this.apiService.post('auth/logout', {}).pipe(
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
    return this.apiService
      .post<RegisterResponse>('auth/register', { email, username, password })
      .pipe(
        tap({
          next: ({ data }) => {
            this.setUser(data.user);
            this.setToken(data.accessToken);

            if (avatar) {
              this.uploadAvatarFile(data.avatarUploadData, avatar).subscribe({
                next: () => {},
                error: (err) => {
                  console.log(err);
                },
              });
            }
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
    // const formData = new FormData();
    // formData.append('avatar', avatar, avatar.name);

    return this.apiService
      .get<{
        data: AvatarUploadData;
      }>('user/update-avatar')
      .pipe(
        tap({
          next: ({ data }) => {
            this.uploadAvatarFile(data, avatar).subscribe({
              next: () => {
                // this.toastService.showToast(
                //   'Avatar uploaded succesfully',
                //   true,
                // );
                // const newAvatarUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
                // const newAvatarUrl = data.publicUrl;
                // this.user.update((u) => {
                //   if (!u) return u;
                //   return { ...u, avatarUrl: newAvatarUrl };
                // });
              },
              error: (err) => {
                console.log(err);
              },
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

  uploadAvatarFile(avatarUploadData: AvatarUploadData, avatar: File) {
    return this.httpClient
      .put(avatarUploadData.uploadUrl, avatar, {
        headers: { 'Content-Type': avatar.type },
      })
      .pipe(
        tap({
          next: () => {
            this.apiService
              .patch<{
                data: { avatarUrl: string };
              }>('user/update-avatar/confirm', {})
              .subscribe({
                next: ({ data: { avatarUrl } }) => {
                  this.user.update((u) => {
                    if (!u) return u;
                    return { ...u, avatarUrl };
                  });
                },
                error: (err) => {
                  console.log(err);
                  this.user.update((u) => {
                    if (!u) return u;
                    return { ...u, avatarUrl: u.defaultAvatarUrl };
                  });
                },
              });
          },
        }),
      );
  }
}
