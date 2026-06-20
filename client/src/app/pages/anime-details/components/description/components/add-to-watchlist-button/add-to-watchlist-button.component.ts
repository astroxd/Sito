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
import { AnimeStatus, AnimeStatusLabels } from 'src/app/models/List';
import { APIService } from 'src/app/services/apiservice';
import { AuthService } from 'src/app/services/auth-service';
import { ListsService } from 'src/app/services/lists-service';

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
  private authService = inject(AuthService);
  private readonly AnimeStatusLabels = AnimeStatusLabels;

  animeDetails = input.required<AnimeDetail | undefined>();
  animeId = computed(() => this.animeDetails()?.id);

  animeStatus = signal<AnimeStatus | null>(null);

  readonly userLists = [
    { status: AnimeStatus.Watching, name: 'Watching' },
    { status: AnimeStatus.Completed, name: 'Completed' },
    { status: AnimeStatus.Dropped, name: 'Dropped' },
  ];

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
    console.log('adedTo list');
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

  sharedLists = signal<any[]>([]);
  getSharedLists() {
    // if (this.animeId() && this.authService.user()) {
    //   this.apiService
    //     .get(
    //       `shared-list/${this.authService.user()?.id}/entrie/${this.animeId()}`,
    //     )
    //     .subscribe((res: any) => {
    //       console.log(res);
    //       this.sharedLists.set(res.data);
    //       // this.animeList.set(res?.entrie?.status ?? null);
    //     });
    // }
  }

  handleSharedList(listId: number, isInList: boolean) {
    //   if (isInList) {
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
    //   } else {
    //     const {
    //       id,
    //       idMal,
    //       title,
    //       coverImage,
    //       episodes,
    //       nextAiringEpisode,
    //       duration,
    //       status,
    //     } = this.animeDetails()!;
    //     if (this.animeId() && this.authService.user()) {
    //       this.apiService
    //         .post(`shared-list/${this.authService.user()?.id}/${listId}/entrie`, {
    //           animeDetails: {
    //             id,
    //             idMal,
    //             title:
    //               title.romaji ?? title.english ?? title.native ?? 'NO TITLE',
    //             coverImage: coverImage.extraLarge ?? coverImage.large,
    //             episodes:
    //               nextAiringEpisode?.episode ??
    //               (status === 'FINISHED' && !nextAiringEpisode ? episodes : 0),
    //             duration: duration ?? 0,
    //           },
    //         })
    //         .pipe(
    //           finalize(() => {
    //             this.getSharedLists();
    //           }),
    //         )
    //         .subscribe((res: any) => {
    //           console.log(res);
    //           // this.sharedLists.set(res.data);
    //           // this.animeList.set(res?.entrie?.status ?? null);
    //         });
    //     }
    //   }
  }
}
