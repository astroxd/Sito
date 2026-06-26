import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
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
  QueryOptions,
  SearchOptions,
  SearchResultsData,
} from './../../models/Search';

import { SearchResults } from './components/search-results/search-results';
import { sortOptions } from 'src/app/helpers/animeSearchOptions';
import { finalize } from 'rxjs';

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
  private routeSnapshot = this.activatedRoute.snapshot;

  private readonly sortOptions = sortOptions;

  searchOptions = signal<SearchOptions | null>(null);

  //* used to signal search bar to clean all the inputs
  cleanupTrigger = signal<boolean>(false);

  //* sortOption and page are detached from options because i need to update them
  //* specifically in searchResultPage
  sortOption = signal(
    this.routeSnapshot.queryParamMap.get('sort') ?? this.sortOptions[0].name,
  );
  page = signal(Number(this.routeSnapshot.queryParamMap.get('page') ?? 1));
  //* //////////////

  queryOptions = computed<QueryOptions>(() => {
    return {
      sort: this.sortOption(),
      page: this.page(),
      searchOptions: this.searchOptions() ?? {},
    } as QueryOptions;
  });

  //* For changing url only
  paramOptions = signal({});
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
    effect(() => {
      console.log('NAVIGATE');
      this.router.navigate([], {
        queryParams: this.queryParamOptions(),
      });
    });
    effect(() => {
      console.log('SEARCH OPTIONS');
      if (this.searchOptions() !== null) {
        this.isLoading.set(true);
        this.animeService
          .SearchAnime(this.queryOptions())
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe((res) => {
            console.log(res);
            this.searchResults.set(res);
          });
      }
    });
  }

  ionViewDidLeave() {
    this.cleanupTrigger.set(true);
  }
}
