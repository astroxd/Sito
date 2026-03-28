import { Component, computed, effect, inject, Signal, signal } from '@angular/core';
import { SearchBar } from './components/search-bar/search-bar';
import { SearchResults } from './components/search-results/search-results';
import { GetAnimes } from '../../get-animes';
import { sortOptions } from './components/searchOptions';
import { toSignal } from '@angular/core/rxjs-interop';

import { AsyncPipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-search',
  imports: [SearchBar, SearchResults, JsonPipe, AsyncPipe],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  sortOptions = sortOptions;
  private animeService = inject(GetAnimes);
  searchOptions = signal({ sortOptions: this.sortOptions[0].name });
  anime: any;

  constructor() {
    effect(() => {
      console.log(this.searchOptions());
      this.anime = this.animeService.SearchAnime(this.searchOptions());
    });
  }
}
