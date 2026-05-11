import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AnimeDetailsPage } from '../pages/anime-details/anime-details.page';
import { ProfilePage } from '../pages/profile/profile.page';

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
        path: 'profile',
        loadComponent: () =>
          import('../pages/profile/profile.page').then((m) => m.ProfilePage),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../pages/profile/components/overview/overview.component').then(
                (m) => m.OverviewComponent,
              ),
          },
          {
            path: 'statistics',
            loadComponent: () =>
              import('../pages/profile/components/statistics/statistics.component').then(
                (m) => m.StatisticsComponent,
              ),
          },
        ],
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
          {
            path: 'episodes',
            loadComponent: () =>
              import('../pages/anime-details/components/details/episodes/episodes.component').then(
                (m) => m.Episodes,
              ),
          },
        ],
      },
      {
        path: 'watchlist',
        loadComponent: () =>
          import('../pages/watch-list/watch-list.page').then(
            (m) => m.WatchListPage,
          ),
      },
      {
        path: 'shared/:listId',
        loadComponent: () =>
          import('../pages/shared-list/shared-list.page').then(
            (m) => m.SharedListPage,
          ),
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
