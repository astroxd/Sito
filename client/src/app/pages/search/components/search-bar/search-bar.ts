import { Component, effect, inject, model, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonRow, IonCol } from '@ionic/angular/standalone';

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
} from '../../../../helpers/animeSearchOptions';
import {
  ParamOptions,
  SearchOption,
  SearchOptions,
} from '../../../../models/Search';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faTags, faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-search-bar',
  imports: [ReactiveFormsModule, SelectMenu, IonRow, IonCol, FontAwesomeModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
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
export class SearchBar {
  private activatedRoute = inject(ActivatedRoute);

  genreOptions = genreOptions;
  yearOptions = yearOptions;
  formatOptions = formatOptions;
  statusOptions = statusOptions;

  faSearch = faSearch;
  faTags = faTags;
  faTimes = faTimes;

  searchOptions = model<SearchOptions | null>();
  page = model<number>(1);
  sort = model<string>(sortOptions[0].name);
  queryParamOptions = model<ParamOptions | null>(null);

  inputSearch = new FormControl('');

  onSubmit(event: Event) {
    event.preventDefault();
    //* If the searchbar is empty and the searchOption object has no search member
    //* OR
    //* If the searchbar has content and is equal to the searcOption value
    //* DON'T search
    if (
      (this.inputSearch.value!.length <= 0 && !this.searchOptions()?.search) ||
      this.inputSearch.value === this.searchOptions()?.search
    )
      return;
    this.shouldReset = true;
    this.search();
  }
  genres = signal<SearchOption[]>([]);
  year = signal<SearchOption[]>([]);
  formats = signal<SearchOption[]>([]);
  status = signal<SearchOption[]>([]);
  season = signal<string>('');

  private shouldReset = false;
  constructor() {
    this.activatedRoute.queryParamMap.subscribe((params) => {
      //* array to string conversion necessary for checking inequality
      //* two different arrays with the same items are different

      //* GENRES
      const urlGenresStr = params.get('genres') || '';
      const localGenresStr = this.genres()
        .map((g) => g.name)
        .join(',');

      if (urlGenresStr !== localGenresStr) {
        console.log(this.genres());
        console.log(getGenres(params.get('genres') || ''));
        this.genres.set(getGenres(urlGenresStr));
      }

      //* YEAR
      const urlYearStr = params.get('year') || '';
      const localYearStr = this.year()
        .map((y) => y.name)
        .join(',');
      if (urlYearStr !== localYearStr) {
        this.year.set(getYear(urlYearStr));
      }

      //* FORMATS
      const urlFormatsStr = params.get('formats') || '';
      const localFormatsStr = this.formats()
        .map((f) => f.name)
        .join(',');
      if (urlFormatsStr !== localFormatsStr) {
        this.formats.set(getFormats(urlFormatsStr));
      }

      //* STATUS
      const urlStatusStr = params.get('status') || '';
      const localStatusStr = this.status()
        .map((s) => s.name)
        .join(',');
      if (urlStatusStr !== localStatusStr) {
        this.status.set(getStatus(urlStatusStr));
      }

      //* SEASON
      this.season.set(params.get('season') || '');

      //* SEARCH
      if (this.inputSearch.value !== (params.get('query') || '')) {
        this.inputSearch.setValue(params.get('query') || '', {
          emitEvent: false,
        });
      }
    });

    effect(() => {
      this.search();
    });
  }

  // ngOnInit(): void {
  //   this.activatedRoute.queryParams.subscribe((param) => {
  //     // if (param['sort'] === undefined) {
  //     //   console.log('test');
  //     //   // this.searchForm().value.set({ search: '' });
  //     //   this.genres.set([]);
  //     //   this.year.set([]);
  //     //   this.formats.set([]);
  //     //   this.status.set([]);
  //     //   return;
  //     // }

  //     const searchParamFromHeader = param['query'];
  //     if (searchParamFromHeader === undefined) return;
  //     if (searchParamFromHeader !== this.inputSearch.value) {
  //       // this.searchForm().value.set({ search: searchParamFromHeader });
  //       this.genres.set([]);
  //       this.year.set([]);
  //       this.formats.set([]);
  //       this.status.set([]);
  //       this.season.set('');
  //       //* The signals update trigger the @search() function
  //     }
  //   });
  // }
  search() {
    let searchOptions: SearchOptions = {
      search: this.inputSearch.value!,
      genre_in: this.genres().map((option: any) => option.name),
      seasonYear: this.year()[0]?.name ?? '',
      format_in: this.formats().map((option: any) => option.name),
      status_in: this.status()[0]?.name ?? '',
      season: this.season(),
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
    let params: ParamOptions = {
      query: this.inputSearch.value!,
      genres: this.genres()
        .map((genre) => genre.name)
        .join(','),
      year: this.year()[0]?.name ?? '',
      formats: this.formats()
        .map((format) => format.name)
        .join(','),
      status: this.status()[0]?.name ?? '',
      season: this.season(),
    };

    //* remove empty values, prevent url like query=&genres=&year=
    for (const [key, param] of Object.entries(params)) {
      if (param.length <= 0) {
        delete params[key as keyof ParamOptions];
      }
    }

    //* resets page number when query changes or any filter is added/removed
    if (this.shouldReset) {
      if (this.page() !== 1) {
        this.page.set(1);
      }

      if (this.season() !== '') {
        this.season.set('');
      }

      this.shouldReset = false;
    }
    this.queryParamOptions.set(params);
  }

  resetOnFilter() {
    this.shouldReset = true;
  }

  deleteGenre(genre: SearchOption) {
    this.genres.set(
      this.genres().filter((_genre) => _genre.name !== genre.name),
    );
    this.resetOnFilter();
  }
  deleteYear(year: SearchOption) {
    this.year.set(this.year().filter((_year) => _year.name !== year.name));
    this.resetOnFilter();
  }
  deleteFormat(format: SearchOption) {
    this.formats.set(
      this.formats().filter((_format) => _format.name !== format.name),
    );
    this.resetOnFilter();
  }
  deleteStatus(status: SearchOption) {
    this.status.set(
      this.status().filter((_status) => _status.name !== status.name),
    );
    this.resetOnFilter();
  }
}
