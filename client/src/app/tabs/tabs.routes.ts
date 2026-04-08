import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AnimeDetailsPage } from '../pages/anime-details/anime-details.page';
import { Details } from '../pages/anime-details/components/details/details.component';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('../pages/search/search.page').then((m) => m.SearchPage),
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('../tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: 'anime/:id',
        component: AnimeDetailsPage,
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../pages/anime-details/components/details/details.component').then(
                (m) => m.Details,
              ),
          },
          {
            path: 'characters',
            loadComponent: () =>
              import('../pages/anime-details/components/details/characters/characters.component').then(
                (m) => m.Characters,
              ),
          },
        ],
        // loadComponent: () =>
        //   import('../pages/anime-details/anime-details.page').then(
        //     (m) => m.AnimeDetailsPage,
        //   ),
      },
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
