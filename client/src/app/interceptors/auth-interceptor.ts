//? Implementation based off
//? https://dev.to/indugrand/the-complete-guide-to-secure-angular-authentication-using-oauth-jwt-with-refresh-tokens-4a3o

import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  filter,
  Observable,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';
import { Router } from '@angular/router';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
  null,
);

export function AuthInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  if (req.url.includes('localhost:3001')) {
    return handleBackendRequests(req, next);
  }
  return next(req);
}

function handleBackendRequests(request: HttpRequest<any>, next: HttpHandlerFn) {
  const authService = inject(AuthService);
  const router = inject(Router);
  const accessToken = authService.token();

  const cloned = addTokenHeader(request, accessToken);

  return next(cloned).pipe(
    catchError((error) => {
      //* Se l'errore è 401 dobbiamo refreshare l'accessToken
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(cloned, next, error, authService);
      }

      if (
        error instanceof HttpErrorResponse &&
        error.status === 403 &&
        cloned.url.includes('/shared-list')
      ) {
        router.navigate(['/profile']);
      }
      return throwError(() => error);
    }),
  );
}

function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  error: HttpErrorResponse,
  authService: AuthService,
) {
  //* Evitiamo di fare il refresh se la richiesta che è fallita era già quella di login o quella di refresh
  if (
    request.url.includes('/login') ||
    request.url.includes('/refresh-token') ||
    request.url.includes('/register')
  ) {
    return throwError(() => error);
  }

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        refreshTokenSubject.next(response.accessToken);

        //* Ripete la richiesta originale fallita con il nuovo token
        return next(addTokenHeader(request, response.accessToken));
      }),
      catchError((refreshErr) => {
        isRefreshing = false;
        authService.logout(); //* Se fallisce anche il refresh token, fai il logout

        return throwError(() => refreshErr);
      }),
    );
  } else {
    //* Se il refresh è già in corso, aspetta che finisca prima di ripetere la richiesta
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next(addTokenHeader(request, token))),
    );
  }
}

function addTokenHeader(request: HttpRequest<any>, token?: string | null) {
  return request.clone({
    withCredentials: true,
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}
