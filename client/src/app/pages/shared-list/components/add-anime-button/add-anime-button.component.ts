import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonLabel,
  IonList,
  ModalController,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonThumbnail,
} from '@ionic/angular/standalone';
import { IonInfiniteScrollCustomEvent } from '@ionic/core';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';
import { Anime } from 'src/app/models/Anime';
import { QueryOptions } from 'src/app/models/Search';

import { GetAnimes } from 'src/app/services/get-animes';
import { SharedListsService } from 'src/app/services/shared-lists-service';

@Component({
  selector: 'app-add-anime-button',
  templateUrl: './add-anime-button.component.html',
  styleUrls: ['./add-anime-button.component.scss'],
  imports: [
    FormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonLabel,
    IonList,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonThumbnail,
  ],
})
export class AddAnimeButtonComponent implements OnInit {
  animeService = inject(GetAnimes);
  sharedListService = inject(SharedListsService);
  modalController = inject(ModalController);

  sharedListId = this.sharedListService.listInfo()?.id!;
  sharedListAnimesSet = computed(
    () =>
      new Set(
        this.sharedListService
          .sharedListAnimes()
          .map((anime) => anime.anime.animeId),
      ),
  );

  searchedAnime = signal<Anime[]>([]);
  private searchSubject = new Subject<string>();

  @ViewChild(IonModal) modal!: IonModal;

  name = '';
  private page: number = 1;

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async openModal() {
    this.searchAnimes('');
    this.modal.present();
    console.log(this.name);

    const dismiss = this.modal.onDidDismiss();
    dismiss.finally(() => {
      this.name = '';
      this.searchedAnime.set([]);
      this.page = 1;
    });
  }

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.page = 1;
        this.searchAnimes(query, this.page, true);
      });
  }

  ngOnInit() {}

  searchAnimes(
    query: string,
    page = 1,
    isNewQuery = false,
    infiniteEvent?: IonInfiniteScrollCustomEvent<void>,
  ) {
    const queryOptions: QueryOptions = { page };
    if (query.trim().length > 0) {
      queryOptions.searchOptions = { search: query };
    }

    this.animeService.SearchAnime(queryOptions).subscribe({
      next: (data) => {
        const newAnime = data.media;

        if (isNewQuery) {
          this.searchedAnime.set(newAnime);
        } else {
          this.searchedAnime.update((currentAnime) => [
            ...currentAnime,
            ...newAnime,
          ]);
        }

        if (infiniteEvent && !data.pageInfo.hasNextPage) {
          infiniteEvent.target.disabled = true;
        }
      },
      error: (err) => {
        console.log('Error', err);
      },
      complete: () => {
        if (infiniteEvent) {
          infiniteEvent.target.complete();
        }
      },
    });
  }

  onIonInfinite($event: IonInfiniteScrollCustomEvent<void>) {
    this.searchAnimes(this.name, ++this.page, false, $event);
  }

  addToSharedList(anime: Anime) {
    this.sharedListService
      .addAnimeToSharedList(this.sharedListId, anime)
      .subscribe((res) => {
        console.log(res.message);
      });
  }
}
