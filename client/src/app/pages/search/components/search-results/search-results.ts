import { Component, effect, input, model, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { sortOptions } from '../searchOptions';
import { AnimeCard } from '../../../../components/anime-card/anime-card';

@Component({
  selector: 'app-search-results',
  imports: [AnimeCard, FormField],
  templateUrl: './search-results.html',
  styleUrls: ['./search-results.css', '../../../../components/section/section.css'],
})
export class SearchResults {
  sortOptions = sortOptions;

  anime = input.required<[] | null>();
  query = input<string | undefined>('');
  page = model<number>(1);
  sort = model<string>(sortOptions[0].name);

  sortModel = signal(this.sort());
  sortForm = form(this.sortModel);

  constructor() {
    effect(() => {
      this.sort.set(this.sortForm().value());
    });
  }

  updatePage() {
    this.page.update((page) => page + 1);
  }
}
