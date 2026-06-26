import { Component, inject } from '@angular/core';
import { GetAnimes } from '../../../../services/get-animes';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationTarget,
  Section,
} from '../../../../components/section/section';
import { Anime } from 'src/app/models/Anime';
import { getCurrentSeason } from 'src/app/helpers/animeSeasons';
import { sortOptions } from 'src/app/helpers/animeSearchOptions';

@Component({
  selector: 'app-popular-this-season',
  imports: [Section],
  template: `<app-section
    sectionName="Popular This Season"
    [animes]="anime()"
    [navigationTarget]="target"
  /> `,
  styles: ``,
})
export class PopularThisSeason {
  AnimeService = inject(GetAnimes);

  target: NavigationTarget = {
    url: '/search',
    params: {
      year: new Date().getFullYear(),
      season: getCurrentSeason(),
      sort: sortOptions[3].name,
    },
  };

  anime = toSignal(this.AnimeService.GetPopularThisSeasonAnimes(), {
    initialValue: [] as Anime[],
  });
}
