import { Component, computed, inject, input, OnInit } from '@angular/core';
import { AnimeDetail } from 'src/app/models/AnimeDetails';
import {
  AnimeStatus,
  AnimeStatusLabels,
  iterableAnimeStatusLabels,
} from 'src/app/models/List';
import { ListsService } from 'src/app/services/lists-service';
import { SharedListsService } from 'src/app/services/shared-lists-service';
import { Anime } from 'src/app/models/Anime';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { ClickOutsideDirective } from 'src/app/directives/click-outside.directive';
@Component({
  selector: 'app-add-to-watchlist-button',
  standalone: true,
  imports: [FontAwesomeModule, ClickOutsideDirective],
  templateUrl: './add-to-watchlist-button.component.html',
  styleUrls: [
    './add-to-watchlist-button.component.scss',
    '../../../../../../styles/dropdown.scss',
  ],
})
export class AddToWatchlistButtonComponent implements OnInit {
  private listsService = inject(ListsService);
  private sharedListsService = inject(SharedListsService);
  private readonly AnimeStatusLabels = AnimeStatusLabels;
  readonly iterableAnimeStatusLabels = iterableAnimeStatusLabels;

  animeDetails = input.required<AnimeDetail>();
  animeId = computed(() => this.animeDetails()?.id);

  animeStatus = this.listsService.animeStatus;
  sharedLists = this.sharedListsService.sharedListsWithAnime;

  formattedAnimeStatus = computed(() => {
    const status = this.animeStatus();
    return status ? this.AnimeStatusLabels[status] : 'Add To Watchlist';
  });

  showWatchlistMenu = false;

  faChevronDown = faChevronDown;
  faChevronUp = faChevronUp;
  constructor() {}

  ngOnInit() {}

  addToList(status: AnimeStatus) {
    this.listsService.addAnime(status, this.animeDetails()!).subscribe();
  }

  removeFromList() {
    this.listsService.removeAnime(this.animeId()!).subscribe();
  }

  updateStatusList(status: AnimeStatus) {
    this.listsService.updateAnime(this.animeId()!, status).subscribe();
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

      // if (this.animeId() && this.authService.user()) {
      this.sharedListsService
        .addAnimeToSharedList(listId, anime, false)
        .subscribe();
      // }
    }
  }
  close() {
    this.showWatchlistMenu = false;
  }
}
