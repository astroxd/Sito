import { Component, inject, OnInit, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IonRow, IonCol, IonProgressBar } from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { AnimeStatus, ListedAnime } from 'src/app/models/List';
import { ListsService } from 'src/app/services/lists-service';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-keep-watching',
  templateUrl: './keep-watching.component.html',
  styleUrls: ['./keep-watching.component.scss'],
  imports: [IonRow, IonCol, IonProgressBar, FontAwesomeModule],
})
export class KeepWatchingComponent implements OnInit {
  private listsService = inject(ListsService);
  private ActivatedRoute = inject(ActivatedRoute);
  faPlus = faPlus;

  userProgress = signal<ListedAnime[]>([]);

  constructor() {
    this.ActivatedRoute.params.subscribe((params) => {
      this.loadProgress();
    });
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
          this.listsService.setListShouldRefetech(true);
        }),
      )
      .subscribe();
  }

  ngOnInit() {}
}
