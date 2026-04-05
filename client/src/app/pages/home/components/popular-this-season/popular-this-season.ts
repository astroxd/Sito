import { Component, inject } from '@angular/core';
import { GetAnimes } from '../../../../services/get-animes';
import { toSignal } from '@angular/core/rxjs-interop';
import { Section } from '../../../../components/section/section';

@Component({
  selector: 'app-popular-this-season',
  imports: [Section],
  template: `<app-section
    sectionName="Popular This Season"
    [animes]="anime()"
    link="B"
  /> `,
  styles: ``,
})
export class PopularThisSeason {
  AnimeService = inject(GetAnimes);

  anime = toSignal(this.AnimeService.GetPopularThisSeasonAnimes(), {
    initialValue: [] as any,
  });
}
