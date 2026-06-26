import { Component, inject } from '@angular/core';
import { SideSection } from '../../../../components/side-section/side-section';
import { GetAnimes } from '../../../../services/get-animes';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationTarget } from 'src/app/components/section/section';
import { getNextSeason } from 'src/app/helpers/animeSeasons';
import { sortOptions } from 'src/app/helpers/animeSearchOptions';
import { Anime } from 'src/app/models/Anime';

@Component({
  selector: 'app-next-season',
  imports: [SideSection],
  template: `<app-side-section
    sectionName="Next Season"
    [animes]="anime()"
    [navigationTarget]="target"
  /> `,
  styles: ``,
})
export class NextSeason {
  AnimeService = inject(GetAnimes);

  target: NavigationTarget = {
    url: '/search',
    params: {
      year: new Date().getFullYear(),
      season: getNextSeason(),
      sort: sortOptions[0].name,
    },
  };

  anime = toSignal(this.AnimeService.GetNextSeasonAnimes(), {
    initialValue: [] as Anime[],
  });
}
