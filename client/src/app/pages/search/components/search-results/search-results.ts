import { Component, computed, effect, input, model } from '@angular/core';

import { AnimeCard } from '../../../../components/anime-card/anime-card';
import { IonRow, IonCol, IonSpinner } from '@ionic/angular/standalone';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SearchOption, SearchResultsData } from '../../../../models/Search';
import { sortOptions } from 'src/app/helpers/animeSearchOptions';
@Component({
  selector: 'app-search-results',
  imports: [ReactiveFormsModule, AnimeCard, IonRow, IonCol, IonSpinner],
  templateUrl: './search-results.html',
  styleUrls: [
    './search-results.scss',
    '../../../../components/section/section.scss',
  ],
})
export class SearchResults {
  readonly sortOptions = sortOptions;

  searchResults = input.required<SearchResultsData | null>();
  query = input<string | undefined>('');
  page = model<number>(1);
  isLoading = input(false);

  sort = model<(typeof sortOptions)[number]['name']>(sortOptions[0].name);
  inputSort = new FormControl(this.sort());

  constructor() {
    effect(() => {
      const parentValue = this.sort();
      if (this.inputSort.value !== parentValue) {
        //  emitEvent: false, valueChangesSubscription doesn't fire
        this.inputSort.setValue(parentValue, { emitEvent: false });
      }
    });

    this.inputSort.valueChanges.subscribe((newSort) => {
      if (newSort && newSort !== this.sort()) {
        this.sort.set(newSort);
      }
    });
  }

  paginationRange = computed(() => {
    const current = this.page();
    const hasNext = this.searchResults()?.pageInfo.hasNextPage ?? false;

    const pages: number[] = [];

    //* add previous page if page > 1
    if (current > 1) {
      pages.push(current - 1);
    }

    //* the current page
    pages.push(current);

    //* add next page if exists
    if (hasNext) {
      pages.push(current + 1);

      if (current === 1) {
        pages.push(current + 2);
      }
    }

    return pages;
  });

  goToPage(page: number) {
    this.page.set(page);
  }
}
