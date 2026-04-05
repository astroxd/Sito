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
import { SearchResults } from './components/search-results/search-results';
import { SearchBar } from './components/search-bar/search-bar';
import { GetAnimes } from 'src/app/services/get-animes';
import { ActivatedRoute, Router } from '@angular/router';
import { sortOptions } from './searchOptions';
import { QueryOptions, SearchOptions } from './searchTypes';

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
    SearchResults,
    SearchBar,
    IonGrid,
  ],
})
export class SearchPage {
  private animeService = inject(GetAnimes);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private routeSnapshot = this.activatedRoute.snapshot;

  sortOptions = sortOptions;

  options = signal<SearchOptions | null>(null);
  sortOption = signal(
    this.routeSnapshot.queryParamMap.get('sort') ?? sortOptions[0].name,
  );
  page = signal(Number(this.routeSnapshot.queryParamMap.get('page') ?? 1));

  queryOptions = computed<QueryOptions>(() => {
    return {
      sort: this.sortOption(),
      page: this.page(),
      options: this.options() ?? {},
    };
  });

  paramOptions = signal({});
  queryParamOptions = computed(() => {
    return {
      ...this.paramOptions(),
      sort: this.sortOption(),
      page: this.page(),
    };
  });

  anime: any;

  constructor() {
    effect(() => {
      this.router.navigate([], {
        queryParams: this.queryParamOptions(),
      });
    });
    effect(() => {
      if (this.options() !== null) {
        this.anime = this.animeService.SearchAnime(this.queryOptions());
      }
    });
  }
}
