import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { Search } from './pages/search/search';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'search',
    component: Search,
  },
];
