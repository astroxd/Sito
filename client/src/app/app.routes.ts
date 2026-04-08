import { Routes } from '@angular/router';
import { AnimeDetailsPage } from './pages/anime-details/anime-details.page';
import { Details } from './pages/anime-details/components/details/details.component';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'anime-details',
    component: AnimeDetailsPage,
    children: [
      {
        path: 'test',
        component: Details,
        // loadComponent: () =>
        //   import('../pages/anime-details/components/details/details.component').then(
        //     (m) => m.Details,
        //   ),
      },
    ],
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
