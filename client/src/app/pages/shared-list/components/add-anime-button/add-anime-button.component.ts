import { AsyncPipe } from '@angular/common';
import {
  Component,
  inject,
  input,
  OnInit,
  output,
  Signal,
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
  IonImg,
  ModalController,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { IonInfiniteScrollCustomEvent } from '@ionic/core';
import { debounceTime, finalize, Observable, Subject } from 'rxjs';
import { Anime } from 'src/app/models/Anime';
import { sortOptions } from 'src/app/pages/search/searchOptions';
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
    AsyncPipe,
    IonImg,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
})
export class AddAnimeButtonComponent implements OnInit {
  onAdd = output();
  sharedListId = input<number>();

  animeService = inject(GetAnimes);
  sharedListService = inject(SharedListsService);
  modalController = inject(ModalController);

  @ViewChild(IonModal) modal!: IonModal;

  name!: string;

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {
    this.modal.dismiss(this.name, 'confirm');
  }

  async openModal() {
    this.searchAnimes('');
    this.modal.present();

    const dismiss = this.modal.onDidDismiss();
    dismiss.finally(() => {
      this.name = '';
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
    this.searchSubject.pipe(debounceTime(300)).subscribe((query) => {
      this.searchAnimes(query);
      this.query = query;
    });
  }

  searchResults = signal<Anime[]>([]);

  searchAnimes(query: string, page = 1) {
    console.log(query);

    if (query.length > 0) {
      this.animeService
        .SearchAnime({
          page: page,
          sort: sortOptions[0].name,
          options: { search: query },
        })
        .subscribe((animes: any) => {
          this.searchResults.update((values) => [...values, ...animes]);
        });
    } else {
      this.animeService
        .SearchAnime({
          page: page,
          sort: sortOptions[0].name,
          options: {},
        })
        .subscribe((animes: any) => {
          console.log(animes);
          this.searchResults.update((values) => [...values, ...animes]);
        });
    }
  }

  onIonInfinite($event: IonInfiniteScrollCustomEvent<void>) {
    this.searchAnimes(this.query, ++this.page);
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
