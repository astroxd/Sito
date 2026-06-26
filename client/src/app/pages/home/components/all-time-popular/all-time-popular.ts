import { Component, inject } from '@angular/core';
import { SideSection } from '../../../../components/side-section/side-section';
import { GetAnimes } from '../../../../services/get-animes';
import { toSignal } from '@angular/core/rxjs-interop';
import { Anime } from 'src/app/models/Anime';

@Component({
  selector: 'app-all-time-popular',
  imports: [SideSection],
  template: `<app-side-section
    sectionName="All Time Popular"
    [animes]="anime()"
    [navigationTarget]="{ url: '/search' }"
  /> `,
  styles: ``,
})
export class AllTimePopular {
  AnimeService = inject(GetAnimes);

  anime = toSignal(this.AnimeService.GetAllTimePopularAnimes(), {
    initialValue: [] as Anime[],
  });
}
