import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AnimeDetails } from 'src/app/services/anime-details';
import { SideAnimeCard } from 'src/app/components/side-anime-card/side-anime-card';
import { AnimeRecommendation } from 'src/app/models/AnimeDetails';

@Component({
  selector: 'app-recommendations',
  template: `
    <div class="anime-details-sidebar">
      <div class="section-header">
        <div class="section-title">
          <h5>You Might Like...</h5>
        </div>
      </div>

      @for (anime of recommendations$ | async; track anime.id) {
        <app-side-anime-card [anime]="anime" />
      }
    </div>
  `,
  imports: [AsyncPipe, SideAnimeCard],
})
export class Recommendations {
  private route = inject(ActivatedRoute);
  private animeDetailsService = inject(AnimeDetails);

  recommendations$: Observable<AnimeRecommendation[]> =
    this.route.paramMap.pipe(
      switchMap((params) => {
        const animeId = Number(params.get('id'));

        if (animeId && !isNaN(animeId)) {
          return this.animeDetailsService.GetAnimeRecommendations(animeId);
        }

        return of([]); // Fallback empty array
      }),
    );
}
