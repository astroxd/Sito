import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { SharedListsService } from '../services/shared-lists-service';
import { list } from 'ionicons/icons';

export const sharedListGuard: CanActivateFn = (route, state) => {
  const sharedListsService = inject(SharedListsService);
  const router = inject(Router);

  const listId = route.paramMap.get('listId');

  if (!listId) {
    return router.createUrlTree(['/home']);
  }

  return sharedListsService.loadSharedList(Number(listId)).pipe(
    map((res) => {
      //* se non fa parte della lista returna 404 con messaggio di errore
      if (res.data) {
        return true;
      }

      return router.createUrlTree(['/home']);
    }),
    catchError(() => {
      return of(router.createUrlTree(['/home']));
    }),
  );
};
