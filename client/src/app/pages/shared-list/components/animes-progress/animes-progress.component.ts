import { Component, inject, OnInit } from '@angular/core';
import {
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonProgressBar,
  IonButton,
} from '@ionic/angular/standalone';
import { SharedListsService } from 'src/app/services/shared-lists-service';

@Component({
  selector: 'app-animes-progress',
  templateUrl: './animes-progress.component.html',
  styleUrls: ['./animes-progress.component.scss'],
  imports: [
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonProgressBar,
    IonButton,
  ],
})
export class AnimesProgressComponent implements OnInit {
  private sharedListsService = inject(SharedListsService);

  sharedListAnimes = this.sharedListsService.sharedListAnimes;
  canEditAnime = this.sharedListsService.canEditAnime;
  listId = this.sharedListsService.listInfo()?.id!;

  constructor() {}

  ngOnInit() {}

  removeAnime(animeId: number) {
    this.sharedListsService
      .removeAnimeFromSharedList(this.listId, animeId)
      .subscribe();
  }
}
