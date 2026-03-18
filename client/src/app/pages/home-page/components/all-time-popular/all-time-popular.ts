import { Component, inject } from '@angular/core';
import { SideSection } from '../../../../components/side-section/side-section';
import { GetAnimes } from '../../../../get-animes';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-all-time-popular',
  imports: [SideSection],
  template: `<app-side-section sectionName="All Time Popular" [animes]="anime()" link="A" /> `,
  styles: ``,
})
export class AllTimePopular {
  AnimeService = inject(GetAnimes);

  anime = toSignal(this.AnimeService.GetAllTimePopularAnimes(), { initialValue: [] as any });
}
