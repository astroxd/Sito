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
import { APIService } from 'src/app/services/apiservice';
import { AuthService } from 'src/app/services/auth-service';

type statusType = 'WATCHING' | 'COMPLETED' | 'DROPPED';
@Component({
  selector: 'app-add-to-watchlist-button',
  templateUrl: './add-to-watchlist-button.component.html',
  styleUrls: [
    './add-to-watchlist-button.component.scss',
    '../../../../../../styles/dropdown.scss',
  ],
})
export class AddToWatchlistButtonComponent implements OnInit {
  apiService = inject(APIService);
  authService = inject(AuthService);

  animeDetails = input.required<AnimeDetail | undefined>();
  animeId = computed(() => this.animeDetails()?.id);

  animeList = signal<number | null>(null);

  readonly userLists = [
    { status: 1, name: 'Watching' },
    { status: 2, name: 'Completed' },
    { status: 3, name: 'Dropped' },
  ];

  animeStatus = computed(() => {
    switch (this.animeList()) {
      case 1:
      case 2:
      case 3:
        const idx = (this.animeList() as number) - 1;
        return this.userLists[idx].name;
      default:
        return 'Add To Watchlist';
    }
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
      this.apiService
        .get(`list/${this.authService.user()?.id}/entrie/${this.animeId()}`)
        .subscribe((res: any) => {
          this.animeList.set(res?.entrie?.status ?? null);
        });
    }
  }

  addToList(listId: number) {
    const {
      id,
      idMal,
      title,
      coverImage,
      episodes,
      nextAiringEpisode,
      duration,
      status,
    } = this.animeDetails()!;

    this.apiService
      .post(`list/${this.authService.user()?.id}/entrie`, {
        animeId: this.animeId(),
        status: 'DROPPED',
        animeDetails: {
          id,
          idMal,
          title: title.romaji ?? title.english ?? title.native ?? 'NO TITLE',
          coverImage: coverImage.extraLarge ?? coverImage.large,
          episodes:
            nextAiringEpisode?.episode ??
            (status === 'FINISHED' && !nextAiringEpisode ? episodes : 0),
          duration: duration ?? 0,
        },
      })
      .pipe(finalize(() => this.getAnimeStatus()))
      .subscribe((res) => {
        console.log(res);
      });
  }

  removeFromList() {
    this.apiService
      .delete(`list/${this.authService.user()?.id}/entrie/${this.animeId()}`)
      .pipe(finalize(() => this.getAnimeStatus()))
      .subscribe();
  }

  updateStatusList(listId: number) {
    this.apiService
      .patch(`list/${this.authService.user()?.id}/entrie`, {
        animeId: this.animeId(),
        status: listId,
      })
      .pipe(finalize(() => this.getAnimeStatus()))
      .subscribe();
  }

  handleList(listId: number, isInList: boolean) {
    if (isInList) {
      this.removeFromList();
    } else if (this.animeList() && this.animeList() !== listId) {
      this.updateStatusList(listId);
    } else {
      this.addToList(listId);
    }
  }

  sharedLists = signal<any[]>([]);
  getSharedLists() {
    if (this.animeId() && this.authService.user()) {
      this.apiService
        .get(
          `shared-list/${this.authService.user()?.id}/entrie/${this.animeId()}`,
        )
        .subscribe((res: any) => {
          console.log(res);
          this.sharedLists.set(res.data);
          // this.animeList.set(res?.entrie?.status ?? null);
        });
    }
  }

  handleSharedList(listId: number, isInList: boolean) {
    if (isInList) {
      //! Non conviene togliere un anime da una lista condivisa da qui perché
      //! potrebbe sbagliare e si cancellano tutti i progressi del gruppo
      // if (this.animeId() && this.authService.user()) {
      //   this.apiService
      //     .delete(
      //       `shared-list/${this.authService.user()?.id}/${listId}/entrie/${this.animeId()}`,
      //     )
      //     .pipe(
      //       finalize(() => {
      //         this.getSharedLists();
      //       }),
      //     )
      //     .subscribe((res: any) => {
      //       console.log(res);
      //     });
      // }
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
      } = this.animeDetails()!;
      if (this.animeId() && this.authService.user()) {
        this.apiService
          .post(`shared-list/${this.authService.user()?.id}/${listId}/entrie`, {
            animeDetails: {
              id,
              idMal,
              title:
                title.romaji ?? title.english ?? title.native ?? 'NO TITLE',
              coverImage: coverImage.extraLarge ?? coverImage.large,
              episodes:
                nextAiringEpisode?.episode ??
                (status === 'FINISHED' && !nextAiringEpisode ? episodes : 0),
              duration: duration ?? 0,
            },
          })
          .pipe(
            finalize(() => {
              this.getSharedLists();
            }),
          )
          .subscribe((res: any) => {
            console.log(res);
            // this.sharedLists.set(res.data);
            // this.animeList.set(res?.entrie?.status ?? null);
          });
      }
    }
  }
}
