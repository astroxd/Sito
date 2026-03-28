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
} from '../searchOptions';

import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  imports: [FontAwesomeModule, FormField, SelectMenu],
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

  searchOptions = model<any>({});

  searchModel = signal({
    search: this.activatedRoute.snapshot.queryParamMap.get('query') ?? '',
  });
  searchForm = form(this.searchModel);

  onSubmit(event: Event) {
    event.preventDefault();
    this.options.set({ ...Object.entries(this.options()), search: this.searchModel().search });
  }

  search() {
    let params: any = {
      query: untracked(this.searchModel).search,
      genres: this.genres()
        .map((genre: any) => genre.name)
        .join(',') as string,
      year: this.year()[0]?.name ?? '',
      formats: this.formats()
        .map((format: any) => format.name)
        .join(',') as string,
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

  //* On page load
  genres = signal(getGenres(this.routeSnapshot.queryParamMap.get('genres') || ''));
  year = signal(getYear(this.routeSnapshot.queryParamMap.get('year') || ''));
  formats = signal(getFormats(this.routeSnapshot.queryParamMap.get('formats') || ''));
  status = signal(getStatus(this.routeSnapshot.queryParamMap.get('status') || ''));
  options = signal({});

  constructor() {
    effect(() => {
      let options: any = {
        search: untracked(this.searchModel).search,
        genre_in: this.genres().map((option: any) => option.name),
        seasonYear: this.year()[0]?.name ?? '',
        format_in: this.formats().map((option: any) => option.name),
        status_in: this.status()[0]?.name ?? '',
      };

      for (const [key, param] of Object.entries(options)) {
        if ((param as any).length <= 0) {
          delete options[key];
        }
      }
      this.options.set(options);

      let searchOptions = {
        sortOptions: 'POPULARITY_DESC',
        options: this.options(),
      };

      this.searchOptions.set(searchOptions);
      this.search();
    });
  }

  deleteGenre(genre: any) {
    this.genres.set(this.genres().filter((_genre: any) => genre.name !== genre.name));
  }
  deleteYear(year: any) {
    this.year.set(this.year().filter((_year: any) => _year.name !== year.name));
  }
  deleteFormat(format: any) {
    this.formats.set(this.formats().filter((_format: any) => _format.name !== format.name));
  }
  deleteStatus(status: any) {
    this.status.set(this.status().filter((_status: any) => _status.name !== status.name));
  }
}
