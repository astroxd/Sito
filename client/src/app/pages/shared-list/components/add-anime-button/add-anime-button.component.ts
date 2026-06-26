import {
  Component,
  inject,
  input,
  OnInit,
  output,
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
  onAdd = output();
  sharedListId = input<number>();
  sharedListAnimeIds = input(new Set<number>());

  animeService = inject(GetAnimes);
  sharedListService = inject(SharedListsService);
  modalController = inject(ModalController);

  @ViewChild(IonModal) modal!: IonModal;

  name!: string;

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async openModal() {
    this.searchAnimes('');
    this.modal.present();

    const dismiss = this.modal.onDidDismiss();
    dismiss.finally(() => {
      this.name = '';
      this.searchedAnime.set([]);
      this.query = '';
      this.page = 1;
    });
  }

  private searchSubject = new Subject<string>();

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  private query: string = '';
  private page: number = 1;

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.query = query;
        this.page = 1;
        this.searchAnimes(query, this.page, true);
      });
  }

  searchedAnime = signal<Anime[]>([]);

  searchAnimes(
    query: string,
    page = 1,
    isNewQuery = false,
    infiniteEvent?: IonInfiniteScrollCustomEvent<void>,
  ) {
    console.log(query);

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
    this.searchAnimes(this.query, ++this.page, false, $event);
  }

  addToSharedList(anime: Anime) {
    this.sharedListService
      .addAnimeToSharedList(this.sharedListId()!, anime)
      .pipe(
        finalize(() => {
          this.onAdd.emit();
        }),
      )
      .subscribe((res) => {
        console.log(res.message);
      });

    this.modal.dismiss();
  }

  ngOnInit() {}
}
