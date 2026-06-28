import { Component, inject, OnInit } from '@angular/core';
import { IonProgressBar } from '@ionic/angular/standalone';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { SharedListsService } from 'src/app/services/shared-lists-service';
import { SharedListUserProgress } from 'src/app/models/SharedList';
@Component({
  selector: 'app-next-episodes',
  templateUrl: './next-episodes.component.html',
  styleUrls: ['./next-episodes.component.scss'],
  imports: [IonProgressBar, FontAwesomeModule],
})
export class NextEpisodesComponent implements OnInit {
  private sharedListsService = inject(SharedListsService);

  userSharedAnimesProgress = this.sharedListsService.userAnimesProgress;
  listId = this.sharedListsService.listInfo()?.id!;

  faPlus = faPlus;

  constructor() {}

  ngOnInit() {}

  addEpisode(userProgress: SharedListUserProgress) {
    this.sharedListsService
      .updateUserAnimeProgress(this.listId, userProgress.animeId)
      .subscribe();
  }
}
