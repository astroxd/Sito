import { Component, input, model } from '@angular/core';

import { sortOptions } from '../../searchOptions';
import { AnimeCard } from '../../../../components/anime-card/anime-card';
import { IonRow, IonCol } from '@ionic/angular/standalone';

@Component({
  selector: 'app-search-results',
  imports: [AnimeCard, IonRow, IonCol],
  templateUrl: './search-results.html',
  styleUrls: [
    './search-results.scss',
    '../../../../components/section/section.scss',
  ],
})
export class SearchResults {
  sortOptions = sortOptions;

  anime = input.required<[] | null>();
  query = input<string | undefined>('');
  page = model<number>(1);

  sortModel = model<string>(sortOptions[0].name);
  // sortForm = form(this.sortModel);

  updatePage() {
    this.page.update((page) => page + 1);
  }
}
