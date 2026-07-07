import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/Authentication/login/login.page').then(
        (m) => m.LoginPage,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/Authentication/register/register.page').then(
        (m) => m.RegisterPage,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
