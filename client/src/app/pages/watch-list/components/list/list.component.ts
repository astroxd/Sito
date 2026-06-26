import {
  Component,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import {
  AnimeStatus,
  ListedAnime,
  ListedAnimeApiRes,
} from 'src/app/models/List';

import { AuthService } from 'src/app/services/auth-service';
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
  private authService = inject(AuthService);

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
      if (this.authService.user()) {
        this.searchAnimes();
      }
    });

    effect(() => {
      if (
        this.listsService.listShouldRefetch() &&
        this.status() === AnimeStatus.Completed
      ) {
        this.listsService.setListShouldRefetech(false);
        this.page = 1;
        this.searchAnimes(this.query, this.page, true);
      }
    });

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.query = query;
        this.page = 1;
        this.searchAnimes(query, 1, true);
      });
  }

  ngOnInit() {}

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
    this.query = query;
    this.page = 1;
  }

  searchAnimes(query = '', page = 1, isNewQuery = false) {
    this.listsService
      .searchAnimes(this.status(), query, page)
      .subscribe((res) => {
        if (isNewQuery) {
          this.listedAnimes.set(res.data);
        } else {
          this.listedAnimes.update((currentAnimes) => [
            ...currentAnimes,
            ...res.data,
          ]);
        }
        this.listedAnimesInfo.set(res);
      });
  }

  loadMore() {
    this.searchAnimes(this.query, ++this.page);
  }
}
