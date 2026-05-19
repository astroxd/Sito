import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  filter,
  map,
  Observable,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { AuthService } from '../services/auth-service';
import { inject } from '@angular/core';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
  null,
);

export function AuthInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  console.log(req.url);

  const authService = inject(AuthService);

  if (req.url.includes('localhost:3001')) {
    console.log('auth');
    const idToken = authService.token();
    console.log(idToken);

    const cloned = req.clone({
      withCredentials: true,
      headers: idToken
        ? req.headers.set('Authorization', 'Bearer ' + idToken)
        : req.headers,
    });

    return next(cloned).pipe(
      catchError((error) => {
        // 2. Se l'errore è 401, proviamo a fare il refresh del token
        if (error instanceof HttpErrorResponse && error.status === 401) {
          // Evitiamo di fare il refresh se la richiesta che è fallita era già quella di login
          if (
            req.url.includes('/login') ||
            req.url.includes('/refresh-token')
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

                // Ripete la richiesta originale fallita con il nuovo token
                return next(
                  req.clone({
                    setHeaders: {
                      Authorization: `Bearer ${response.accessToken}`,
                    },
                  }),
                );
              }),
              catchError((refreshErr) => {
                isRefreshing = false;
                authService.logout(); // Se fallisce anche il refresh token, forza il logout

                return throwError(() => refreshErr);
              }),
            );
          } else {
            // Se il refresh è già in corso, aspetta che finisca prima di ripetere la richiesta
            return refreshTokenSubject.pipe(
              filter((token) => token !== null),
              take(1),
              switchMap((token) =>
                next(
                  req.clone({
                    setHeaders: { Authorization: `Bearer ${token}` },
                  }),
                ),
              ),
            );
          }
        }

        return throwError(() => error);
      }),
    );
  }
  return next(req);
}
