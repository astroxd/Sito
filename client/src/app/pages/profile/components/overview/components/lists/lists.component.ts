import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimeStatus, ListedAnime } from 'src/app/models/List';
import { AuthService } from 'src/app/services/auth-service';
import { IonProgressBar } from '@ionic/angular/standalone';
import { ListsService } from 'src/app/services/lists-service';

@Component({
  selector: 'app-profile-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.scss'],
  imports: [RouterLink, IonProgressBar],
})
export class ListsComponent implements OnInit {
  private listsService = inject(ListsService);
  private authService = inject(AuthService);
  public readonly AnimeStatus = AnimeStatus;

  status = signal<AnimeStatus>(AnimeStatus.Watching);

  listedAnimes = signal<ListedAnime[]>([]);

  constructor() {
    effect(() => {
      if (this.authService.user()) {
        this.listsService
          .getListedAnimes(this.status())
          .subscribe(({ data }) => {
            console.log(data);
            this.listedAnimes.set(data);
          });
      }
    });
  }

  ngOnInit() {}
}
