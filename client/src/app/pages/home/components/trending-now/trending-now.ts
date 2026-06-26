import { Component, inject, OnInit } from '@angular/core';
import { GetAnimes } from '../../../../services/get-animes';
import { Section } from '../../../../components/section/section';
import { toSignal } from '@angular/core/rxjs-interop';
import { Anime } from 'src/app/models/Anime';

@Component({
  selector: 'app-trending-now',
  imports: [Section],
  template: `<app-section
    sectionName="Trending Now"
    [animes]="anime()"
    [navigationTarget]="{ url: '/search', params: { sort: 'TRENDING_DESC' } }"
  /> `,
  styles: ``,
})
export class TrendingNow implements OnInit {
  AnimeService = inject(GetAnimes);

  anime = toSignal(this.AnimeService.GetTrendingNowAnimes(), {
    initialValue: [] as Anime[],
  });

  ngOnInit(): void {}
}
