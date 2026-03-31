import { Component, effect, inject, model, OnInit, signal, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { form, FormField } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faTags, faTimes } from '@fortawesome/free-solid-svg-icons';

import { SelectMenu } from '../../../../components/select-menu/select-menu';
import {
  genreOptions,
  yearOptions,
  formatOptions,
  statusOptions,
  getGenres,
  getYear,
  getFormats,
  getStatus,
  sortOptions,
} from '../searchOptions';
import { SearchOption, SearchOptions } from '../../searchTypes';

@Component({
  selector: 'app-search-bar',
  imports: [FontAwesomeModule, FormField, SelectMenu],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css', '../../../../components/section/section.css'],
})

//* Brief description
//* When the page loads the signals load their values from the URL
//* The user can search in 2 different ways
//*    + the user update the dropdown menus
//*    + the user submits the form
//* in both cases the searchOption object is updated and it is sent to
//* the search parent to search the animes
//* it also resets the page and sort values to their default (1, POPULARITY_DESC)
//*
//* meanwhile the URL is updated through the @updateQueryParams function
//* which sends the queryParams to the search parent who updates the URL
//* it's important to note that the updated URL doesn't change the signals
export class SearchBar implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private routeSnapshot = this.activatedRoute.snapshot;

  faSearch = faSearch;
  faTags = faTags;
  faTimes = faTimes;

  genreOptions = genreOptions;
  yearOptions = yearOptions;
  formatOptions = formatOptions;
  statusOptions = statusOptions;

  searchOptions = model<SearchOptions | null>({});
  page = model<number>(1);
  sort = model<string>(sortOptions[0].name);
  queryParamOptions = model({});

  searchModel = signal({
    search: this.activatedRoute.snapshot.queryParamMap.get('query') ?? '',
  });
  searchForm = form(this.searchModel);

  onSubmit(event: Event) {
    event.preventDefault();
    //* If the searchbar is empty and the searchOption object has no search member
    //* OR
    //* If the searchbar has content and is equal to the searcOption value
    //* DON'T search
    if (
      (this.searchModel().search.length <= 0 && !this.searchOptions()?.search) ||
      this.searchModel().search === this.searchOptions()?.search
    )
      return;
    this.search();
  }

  //* On page load
  genres = signal(getGenres(this.routeSnapshot.queryParamMap.get('genres') || ''));
  year = signal(getYear(this.routeSnapshot.queryParamMap.get('year') || ''));
  formats = signal(getFormats(this.routeSnapshot.queryParamMap.get('formats') || ''));
  status = signal(getStatus(this.routeSnapshot.queryParamMap.get('status') || ''));

  constructor() {
    effect(() => {
      this.search();
    });
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((param) => {
      const searchParamFromHeader = param['query'];
      if (searchParamFromHeader === undefined) return;
      if (searchParamFromHeader !== this.searchModel().search) {
        this.searchForm().value.set({ search: searchParamFromHeader });
        this.genres.set([]);
        this.year.set([]);
        this.formats.set([]);
        this.status.set([]);
        //* The signals update trigger the @search() function
      }
    });
  }
  search() {
    let searchOptions: SearchOptions = {
      search: untracked(this.searchModel).search,
      genre_in: this.genres().map((option: any) => option.name),
      seasonYear: this.year()[0]?.name ?? '',
      format_in: this.formats().map((option: any) => option.name),
      status_in: this.status()[0]?.name ?? '',
    };

    for (const [key, param] of Object.entries(searchOptions)) {
      if (param.length <= 0) {
        delete searchOptions[key as keyof SearchOptions];
      }
    }

    this.updateQueryParams();

    this.searchOptions.set(searchOptions);
  }

  updateQueryParams() {
    let params: any = {
      query: untracked(this.searchModel).search,
      genres: this.genres()
        .map((genre) => genre.name)
        .join(','),
      year: this.year()[0]?.name ?? '',
      formats: this.formats()
        .map((format) => format.name)
        .join(','),
      status: this.status()[0]?.name ?? '',
    };

    //* remove empty values, prevent url like query=&genres=&year=
    for (const [key, param] of Object.entries(params)) {
      if ((param as any).length <= 0) {
        delete params[key];
      }
    }

    this.page.set(1);
    this.sort.set(sortOptions[0].name);
    this.queryParamOptions.set(params);
  }

  deleteGenre(genre: SearchOption) {
    this.genres.set(this.genres().filter((_genre) => _genre.name !== genre.name));
  }
  deleteYear(year: SearchOption) {
    this.year.set(this.year().filter((_year) => _year.name !== year.name));
  }
  deleteFormat(format: SearchOption) {
    this.formats.set(this.formats().filter((_format) => _format.name !== format.name));
  }
  deleteStatus(status: SearchOption) {
    this.status.set(this.status().filter((_status) => _status.name !== status.name));
  }
}
