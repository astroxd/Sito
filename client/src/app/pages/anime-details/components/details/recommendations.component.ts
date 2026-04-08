import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from 'node_modules/@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AnimeDetails } from 'src/app/services/anime-details';
import { SideAnimeCard } from 'src/app/components/side-anime-card/side-anime-card';

@Component({
  selector: 'app-recommendations',
  template: `<div class="anime-details-sidebar">
    <div class="section-header">
      <div class="section-title">
        <h5>You Might Like...</h5>
      </div>
    </div>
    <!-- prettier-ignore -->
    @for (anime of (recommendations$ | async); track $index) {
        <app-side-anime-card key="{idx}" [anime]="anime.node.mediaRecommendation" />
    }
  </div>`,
  imports: [AsyncPipe, SideAnimeCard],
})
export class Recommendations implements OnInit {
  private route = inject(ActivatedRoute);
  private AnimeDetailsService = inject(AnimeDetails);

  recommendations$: any;

  constructor() {
    const animeId = this.route.snapshot.paramMap.get('id');
    if (animeId) {
      this.recommendations$ =
        this.AnimeDetailsService.GetAnimeRecommendations(animeId);
    }
  }

  ngOnInit() {}
}
