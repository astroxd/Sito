import { Component, computed, effect, inject, Signal, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { SearchBar } from './components/search-bar/search-bar';
import { SearchResults } from './components/search-results/search-results';

import { GetAnimes } from '../../get-animes';
import { sortOptions } from './components/searchOptions';
import { QueryOptions, SearchOptions } from './searchTypes';

@Component({
  selector: 'app-search',
  imports: [SearchBar, SearchResults, AsyncPipe],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  private animeService = inject(GetAnimes);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private routeSnapshot = this.activatedRoute.snapshot;

  sortOptions = sortOptions;

  options = signal<SearchOptions>({});
  sortOption = signal(this.routeSnapshot.queryParamMap.get('sort') ?? sortOptions[0].name);
  page = signal(Number(this.routeSnapshot.queryParamMap.get('page') ?? 1));

  queryOptions = computed<QueryOptions>(() => {
    return { sort: this.sortOption(), page: this.page(), options: this.options() };
  });
  anime: any;

  constructor() {
    effect(() => {
      this.router.navigate([], {
        queryParams: { sort: this.sortOption(), page: this.page() },
        queryParamsHandling: 'merge',
      });

      console.log(this.queryOptions());
      this.anime = this.animeService.SearchAnime(this.queryOptions());
    });
  }
}
