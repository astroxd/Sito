import {
  Component,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import {
  AnimeStatus,
  ListedAnime,
  ListedAnimeApiRes,
} from 'src/app/models/List';

import { IonRow, IonCol } from '@ionic/angular/standalone';
import { AnimeCard } from 'src/app/components/anime-card/anime-card';
import { ListsService } from 'src/app/services/lists-service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  imports: [IonRow, IonCol, AnimeCard],
})
export class ListComponent implements OnInit {
  private listsService = inject(ListsService);

  public readonly name = input.required<string>();
  public readonly status = input.required<AnimeStatus>();

  public listedAnimes = signal<ListedAnime[]>([]);
  public listedAnimesInfo = signal<ListedAnimeApiRes>({
    message: '',
    data: [],
    page: 0,
    perPage: 0,
    hasNextPage: false,
  });

  private searchSubject = new Subject<string>();
  private query = '';
  private page = 1;

  constructor() {
    effect(() => {
      if (this.status() && this.query === '') {
        const serviceData = this.listsService.getSignalByStatus(
          this.status(),
        )();
        this.listedAnimes.set(serviceData);
        this.page = 1;
      }
    });

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        //* SwitchMap: se modifico la query mentre una richiesta è ancora in corso,
        //* annulla automaticamente la vecchia richiesta e avvia la nuova.
        switchMap((query) => {
          if (query === '') {
            const serviceData = this.listsService.getSignalByStatus(
              this.status(),
            )();
            this.listedAnimes.set(serviceData);
            this.page = 1;
            //* per non farlo arrivare al subscribe, ho aggiornato i dati qui
            return of(null);
          }
          return this.listsService.searchAnimes(this.status(), query, 1);
        }),
      )
      .subscribe((res) => {
        if (res) {
          this.listedAnimes.set(res.data);
          this.listedAnimesInfo.set(res);
        }
      });
  }

  ngOnInit() {}

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.query = query;
    this.searchSubject.next(query);
  }

  loadMore() {
    this.listsService
      .searchAnimes(this.status(), this.query, ++this.page)
      .subscribe((res) => {
        this.listedAnimes.update((currentAnimes) => [
          ...currentAnimes,
          ...res.data,
        ]);
        this.listedAnimesInfo.set(res);
      });
  }
}
