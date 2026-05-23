import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return true;

  if (authService.isAuthenticated()) {
    return true;
  }

  const targetUrl = state.url;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: targetUrl },
  });
};
