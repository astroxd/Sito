import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  // {
  //   path: 'home',
  //   loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  // },
  // {
  //   path: 'search',
  //   loadComponent: () =>
  //     import('./pages/search/search.page').then((m) => m.SearchPage),
  // },
];
