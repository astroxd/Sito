import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ListedAnime, ListedAnimeApiRes } from 'src/app/models/Anime';
import { APIService } from 'src/app/services/apiservice';
import { AuthService } from 'src/app/services/auth-service';
import { IonProgressBar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-profile-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.scss'],
  imports: [RouterLink, IonProgressBar],
})
export class ListsComponent implements OnInit {
  private apiService = inject(APIService);
  private authService = inject(AuthService);

  status = signal(1);

  listedAnimes = signal<ListedAnime[]>([]);

  constructor() {
    effect(() => {
      if (this.authService.user()) {
        this.apiService
          .get<ListedAnimeApiRes>(
            `lists/${this.authService.user()?.id}/${this.status()}/1`,
          )
          .subscribe(({ data }) => {
            this.listedAnimes.set(data);
          });
      }
    });
  }

  ngOnInit() {}
}
