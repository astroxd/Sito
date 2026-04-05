import { Component, inject } from '@angular/core';
import { SideSection } from '../../../../components/side-section/side-section';
import { GetAnimes } from '../../../../services/get-animes';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-next-season',
  imports: [SideSection],
  template: `<app-side-section
    sectionName="Next Season"
    [animes]="anime()"
    link="A"
  /> `,
  styles: ``,
})
export class NextSeason {
  AnimeService = inject(GetAnimes);

  anime = toSignal(this.AnimeService.GetNextSeasonAnimes(), {
    initialValue: [] as any,
  });
}
