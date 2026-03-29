import { Component, effect, inject, model, signal, untracked } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faTags, faTimes } from '@fortawesome/free-solid-svg-icons';
import { form, FormField } from '@angular/forms/signals';
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

import { ActivatedRoute, Router } from '@angular/router';
import { SearchOption, SearchOptions } from '../../searchTypes';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-search-bar',
  imports: [FontAwesomeModule, FormField, SelectMenu, JsonPipe],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css', '../../../../components/section/section.css'],
})
export class SearchBar {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private routeSnapshot = this.activatedRoute.snapshot;

  faSearch = faSearch;
  faTags = faTags;
  faTimes = faTimes;

  genreOptions = genreOptions;
  yearOptions = yearOptions;
  formatOptions = formatOptions;
  statusOptions = statusOptions;

  searchOptions = model<SearchOptions>({});
  page = model<number>(1);
  sort = model<string>(sortOptions[0].name);

  searchModel = signal({
    search: this.activatedRoute.snapshot.queryParamMap.get('query') ?? '',
  });
  searchForm = form(this.searchModel);

  onSubmit(event: Event) {
    console.log('Onsubmi');
    event.preventDefault();
    // this.searchOptions.update((options) => {
    //   if (this.searchModel().search.length <= 0) {
    //     delete options['search'];
    //     return { ...options };
    //   }
    //   return {
    //     ...options,
    //     search: this.searchModel().search,
    //   };
    // });
    // console.log(this.searchOptions());
    if (
      (this.searchModel().search.length <= 0 && !this.searchOptions().search) ||
      this.searchModel().search === this.searchOptions().search
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

    this.page.set(1);
    this.sort.set(sortOptions[0].name);
    this.searchOptions.set(searchOptions);

    // let searchOptions = {
    //   sortOptions: 'POPULARITY_DESC',
    //   options: this.options(),
    // };

    // this.searchOptions.set(searchOptions);
    this.updateQueryParams();
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
    this.router.navigate([], {
      queryParams: params,
    });
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
