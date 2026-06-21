import { Component, inject, OnInit, signal, Signal } from '@angular/core';
import { Router, RouterLink, ROUTER_OUTLET_DATA } from '@angular/router';
import {
  IonRow,
  IonCol,
  InfiniteScrollCustomEvent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import {
  AnimeDetail,
  AnimeEpisode,
  AnimeEpisodeApiRes,
} from 'src/app/models/AnimeDetails';
import { AnimeDetails } from 'src/app/services/anime-details';
import { SideEpisodeCardComponent } from './side-episode-card/side-episode-card.component';

@Component({
  selector: 'app-episodes',
  templateUrl: './episodes.component.html',
  styleUrls: ['./episodes.component.scss'],
  imports: [
    IonRow,
    IonCol,
    SideEpisodeCardComponent,
    RouterLink,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
})
export class Episodes implements OnInit {
  outletData = inject(ROUTER_OUTLET_DATA) as Signal<{ id: string }>;
  public router = inject(Router);
  private AnimeDetailsService = inject(AnimeDetails);

  public episodes = signal<AnimeEpisode[]>([]);

  private animeId;
  private malId: number | null = null;
  public isFullPage = false;

  private page = 1;
  public isLoading = false;
  constructor() {
    this.isFullPage = this.router.url.endsWith('episodes');
    this.animeId = this.outletData().id;

    this.AnimeDetailsService.GetAnimeDetails(this.animeId)
      .pipe(
        finalize(() => {
          this.loadEpisodes();
        }),
      )
      .subscribe((res: AnimeDetail) => (this.malId = res.idMal ?? null));
  }

  ngOnInit() {}

  loadEpisodes(event?: InfiniteScrollCustomEvent) {
    this.isLoading = true;
    this.AnimeDetailsService.GetAnimeEpisodes(this.malId as number, this.page)
      .pipe(
        finalize(() => {
          if (event) {
            event.target.complete();
            this.isLoading = false;
          }
        }),
      )
      .subscribe({
        next: (res: AnimeEpisodeApiRes) => {
          this.episodes.update((episodes) => [...episodes, ...res.data]);
          if (event) {
            event.target.disabled = !res.pagination.has_next_page;
          }
        },
      });
  }

  loadMore(event: InfiniteScrollCustomEvent) {
    this.page++;
    this.loadEpisodes(event);
  }
}
