import {
  Component,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { debounceTime, Subject, tap } from 'rxjs';
import {
  AnimeStatus,
  ListedAnime,
  ListedAnimeApiRes,
} from 'src/app/models/List';

import { APIService } from 'src/app/services/apiservice';
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

  constructor() {
    effect(() => {
      if (this.authService.user()) {
        this.searchAnimes();
      }
    });

    this.searchSubject.pipe(debounceTime(300)).subscribe((query) => {
      this.searchAnimes(query);
    });
  }

  ngOnInit() {}

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  searchAnimes(query?: string, page = 1) {
    this.listsService
      .searchAnimes(this.status(), query, page)
      .subscribe((res) => {
        console.log(res);
        if (page === 1) {
          this.listedAnimes.set(res.data);
        } else {
          this.listedAnimes.set([...this.listedAnimes(), ...res.data]);
        }
        this.listedAnimesInfo.set(res);
      });
  }
}
