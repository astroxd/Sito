import { Component, inject, OnInit, signal } from '@angular/core';
import { IonRow, IonCol, IonProgressBar } from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { AnimeStatus, ListedAnime } from 'src/app/models/List';
import { ListsService } from 'src/app/services/lists-service';

@Component({
  selector: 'app-keep-watching',
  templateUrl: './keep-watching.component.html',
  styleUrls: ['./keep-watching.component.scss'],
  imports: [IonRow, IonCol, IonProgressBar],
})
export class KeepWatchingComponent implements OnInit {
  private listsService = inject(ListsService);

  userProgress = signal<ListedAnime[]>([]);

  constructor() {
    this.loadProgress();
  }

  loadProgress() {
    this.listsService
      .getUserProgress(AnimeStatus.Watching)
      .subscribe(({ data }) => {
        this.userProgress.set(data);
      });
  }

  addEpisode(animeId: number) {
    this.listsService
      .addWatchedEpisode(animeId)
      .pipe(
        finalize(() => {
          this.loadProgress();
        }),
      )
      .subscribe();
  }

  ngOnInit() {}
}
