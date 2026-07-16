import { Component, inject, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IonRow, IonCol, IonProgressBar } from '@ionic/angular/standalone';
import { ListsService } from 'src/app/services/lists-service';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-keep-watching',
  templateUrl: './keep-watching.component.html',
  styleUrls: ['./keep-watching.component.scss'],
  imports: [IonRow, IonCol, IonProgressBar, FontAwesomeModule],
})
export class KeepWatchingComponent implements OnInit {
  private listsService = inject(ListsService);
  faPlus = faPlus;

  userProgress = this.listsService.userProgress;

  constructor() {}

  ngOnInit() {}

  addEpisode(animeId: number, isLastEpisode: boolean) {
    this.listsService.addWatchedEpisode(animeId, isLastEpisode).subscribe();
  }
}
