import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
} from '@ionic/angular/standalone';
import { SearchBar } from './components/search-bar/search-bar';
import { GetAnimes } from 'src/app/services/get-animes';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ParamOptions,
  QueryOptions,
  SearchOptions,
  SearchResultsData,
} from './../../models/Search';

import { SearchResults } from './components/search-results/search-results';
import { sortOptions } from 'src/app/helpers/animeSearchOptions';
import { finalize, switchMap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    SearchBar,
    IonGrid,
    SearchResults,
  ],
})
export class SearchPage {
  private animeService = inject(GetAnimes);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  private readonly sortOptions = sortOptions;

  searchOptions = signal<SearchOptions | null>(null);

  //* sortOption and page are detached from options because i need to update them
  //* specifically in searchResultPage
  sortOption = signal(this.sortOptions[0].name);
  page = signal(1);
  //* //////////////

  queryOptions = computed<QueryOptions>(() => {
    return {
      sort: this.sortOption(),
      page: this.page(),
      searchOptions: this.searchOptions() ?? {},
    } as QueryOptions;
  });

  //* For changing url only
  paramOptions = signal<ParamOptions | null>(null);
  queryParamOptions = computed(() => {
    return {
      ...this.paramOptions(),
      sort: this.sortOption(),
      page: this.page(),
    };
  });

  searchResults = signal<SearchResultsData | null>(null);
  isLoading = signal<boolean>(false);

  constructor() {
    this.activatedRoute.queryParamMap.subscribe((params) => {
      if (params.get('sort') !== this.sortOption()) {
        this.sortOption.set(params.get('sort') ?? this.sortOptions[0].name);
      }

      if (params.get('page') === null) {
        this.page.set(1);
      } else if (Number(params.get('page')) !== this.page()) {
        this.page.set(Number(params.get('page') ?? 1));
      }
    });

    toObservable(this.queryOptions)
      .pipe(
        switchMap((currentQueryOptions) => {
          this.isLoading.set(true);
          return this.animeService
            .SearchAnime(currentQueryOptions)
            .pipe(finalize(() => this.isLoading.set(false)));
        }),
      )
      .subscribe({
        next: (res) => {
          this.searchResults.set(res);
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
        },
      });

    effect(() => {
      this.router.navigate([], {
        queryParams: this.queryParamOptions(),
      });
    });
  }
}
