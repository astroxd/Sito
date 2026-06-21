import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';
import { AnimeDetail } from 'src/app/models/AnimeDetails';
import {
  AnimeStatus,
  AnimeStatusLabels,
  iterableAnimeStatusLabels,
} from 'src/app/models/List';
import { AuthService } from 'src/app/services/auth-service';
import { ListsService } from 'src/app/services/lists-service';
import { SharedListsService } from 'src/app/services/shared-lists-service';
import { Anime } from 'src/app/models/Anime';

@Component({
  selector: 'app-add-to-watchlist-button',
  templateUrl: './add-to-watchlist-button.component.html',
  styleUrls: [
    './add-to-watchlist-button.component.scss',
    '../../../../../../styles/dropdown.scss',
  ],
})
export class AddToWatchlistButtonComponent implements OnInit {
  private listsService = inject(ListsService);
  private sharedListsService = inject(SharedListsService);
  private authService = inject(AuthService);
  private readonly AnimeStatusLabels = AnimeStatusLabels;
  readonly iterableAnimeStatusLabels = iterableAnimeStatusLabels;

  animeDetails = input.required<AnimeDetail | undefined>();
  animeId = computed(() => this.animeDetails()?.id);

  animeStatus = signal<AnimeStatus | null>(null);

  formattedAnimeStatus = computed(() => {
    const status = this.animeStatus();
    return status ? this.AnimeStatusLabels[status] : 'Add To Watchlist';
  });

  showWatchlistMenu = false;

  constructor() {
    effect(() => {
      this.getAnimeStatus();
      this.getSharedLists();
    });
  }

  ngOnInit() {}

  getAnimeStatus() {
    if (this.animeId() && this.authService.user()) {
      this.listsService.getListedAnime(this.animeId()!).subscribe((res) => {
        this.animeStatus.set(res?.data?.status ?? null);
      });
    }
  }

  addToList(status: AnimeStatus) {
    this.listsService
      .addAnime(status, this.animeDetails()!)
      .pipe(finalize(() => this.getAnimeStatus()))
      .subscribe();
  }

  removeFromList() {
    this.listsService
      .removeAnime(this.animeId()!)
      .pipe(finalize(() => this.getAnimeStatus()))
      .subscribe();
  }

  updateStatusList(status: AnimeStatus) {
    this.listsService
      .updateAnime(this.animeId()!, status)
      .pipe(finalize(() => this.getAnimeStatus()))
      .subscribe();
  }

  handleList(status: AnimeStatus, isInList: boolean) {
    if (!this.animeDetails()) return;

    if (isInList) {
      this.removeFromList();
    } else if (this.animeStatus() && this.animeStatus() !== status) {
      this.updateStatusList(status);
    } else {
      this.addToList(status);
    }
  }

  sharedLists = signal<
    {
      sharedListId: number;
      sharedListName: string;
      animeId?: number;
    }[]
  >([]);

  getSharedLists() {
    if (this.animeId() && this.authService.user()) {
      this.sharedListsService
        .getSharedListsWithAnimeId(this.animeId()!)
        .subscribe((res) => {
          this.sharedLists.set(res.data);
        });
    }
  }

  handleSharedList(listId: number, isInList: boolean) {
    if (isInList) {
      //     //! Non conviene togliere un anime da una lista condivisa da qui perché
      //     //! potrebbe sbagliare e si cancellano tutti i progressi del gruppo
      //     // if (this.animeId() && this.authService.user()) {
      //     //   this.apiService
      //     //     .delete(
      //     //       `shared-list/${this.authService.user()?.id}/${listId}/entrie/${this.animeId()}`,
      //     //     )
      //     //     .pipe(
      //     //       finalize(() => {
      //     //         this.getSharedLists();
      //     //       }),
      //     //     )
      //     //     .subscribe((res: any) => {
      //     //       console.log(res);
      //     //     });
      //     // }
    } else {
      const {
        id,
        idMal,
        title,
        coverImage,
        episodes,
        nextAiringEpisode,
        duration,
        status,
        popularity,
      } = this.animeDetails()!;

      const anime: Anime = {
        id,
        idMal,
        title: {
          english: title.english,
          romaji: title.romaji,
        },
        coverImage,
        episodes,
        nextAiringEpisode: {
          episode: nextAiringEpisode?.episode,
        },

        status,
        duration,
        popularity,
        genres: [],
      };

      if (this.animeId() && this.authService.user()) {
        this.sharedListsService
          .addAnimeToSharedList(listId, anime)
          .pipe(
            finalize(() => {
              this.getSharedLists();
            }),
          )
          .subscribe();
      }
    }
  }
}
