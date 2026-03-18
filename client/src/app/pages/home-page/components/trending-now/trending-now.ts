import { Component, inject, OnInit } from '@angular/core';
import { GetAnimes } from '../../../../get-animes';
import { Section } from '../../../../components/section/section';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-trending-now',
  imports: [Section],
  template: `<app-section sectionName="Trending Now" [animes]="anime()" link="A" /> `,
  styles: ``,
})
export class TrendingNow implements OnInit {
  AnimeService = inject(GetAnimes);

  anime = toSignal(this.AnimeService.GetTrendingNowAnimes(), { initialValue: [] as any });

  ngOnInit(): void {}
}
