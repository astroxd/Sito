import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { Router, RouterLink, ROUTER_OUTLET_DATA } from '@angular/router';
import {
  IonRow,
  IonCol,
  InfiniteScrollCustomEvent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { finalize, tap } from 'rxjs';
import { AnimeEpisode, AnimeEpisodeApiRes } from 'src/app/models/AnimeDetails';
import { AnimeDetails } from 'src/app/services/anime-details';
import { SideEpisodeCardComponent } from './side-episode-card/side-episode-card.component';
import { AnimeStatus } from 'src/app/models/List';
import { ListsService } from 'src/app/services/lists-service';
import { AuthService } from 'src/app/services/auth-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons';
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
    FontAwesomeModule,
  ],
})
export class Episodes implements OnInit {
  outletData = inject(ROUTER_OUTLET_DATA) as Signal<{ id: number }>;
  public router = inject(Router);
  private AnimeDetailsService = inject(AnimeDetails);
  private listsService = inject(ListsService);
  private authService = inject(AuthService);

  public episodes = signal<AnimeEpisode[]>([]);

  public lastEpisodeWatched = computed(() => {
    const animeStatus = this.listsService.animeStatus();

    if (!animeStatus) {
      return null;
    }

    if (animeStatus === AnimeStatus.Completed) {
      return this.listsService.episodes();
    }

    return this.listsService.lastEpisodeWatched()?.lastEpisodeWatched!;
  });

  private animeId;
  private malId: number | null = null;
  public isFullPage = false;

  private page = 1;
  faLongArrowAltRight = faLongArrowAltRight;

  constructor() {
    this.isFullPage = this.router.url.endsWith('episodes');
    this.animeId = this.outletData().id;

    effect(() => {
      const details = this.AnimeDetailsService.animeDetails();

      this.malId = details?.idMal ?? null;
      const episodesNumber =
        details?.nextAiringEpisode?.episode ?? details?.episodes ?? null;

      this.listsService.episodes.set(episodesNumber);
      if (this.malId) {
        this.loadEpisodes();
      }
    });

    if (this.authService.user()) {
      this.getLastEpisodeWatched();
    }
  }

  ngOnInit() {}

  loadEpisodes(event?: InfiniteScrollCustomEvent) {
    //TODO remove
    return;
    this.AnimeDetailsService.GetAnimeEpisodes(this.malId!, this.page)
      .pipe(
        tap((data) => console.log(data)),
        finalize(() => {
          if (event) {
            event.target.complete();
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
        complete: () => {
          if (event) {
            event.target.complete();
          }
        },
      });
  }

  loadMore(event: InfiniteScrollCustomEvent) {
    this.page++;
    this.loadEpisodes(event);
  }

  getLastEpisodeWatched() {
    this.listsService.getLastEpisodeWatched(this.animeId).subscribe();
  }

  updateWatchedEpisode(episodeTarget: number) {
    this.listsService
      .updateWatchedEpisode(this.animeId, episodeTarget)
      .subscribe({
        next: () => {
          console.log(`Progressi portati all'episodio ${episodeTarget}`);
        },
        error: (err) =>
          console.error("Errore durante l'aggiornamento rapido:", err),
      });
  }
}
