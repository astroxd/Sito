import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonRow,
  IonGrid,
  IonCol,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth-service';

import { SharedListsService } from 'src/app/services/shared-lists-service';
import { AddAnimeButtonComponent } from './components/add-anime-button/add-anime-button.component';
import { AddMemberButtonComponent } from './components/add-member-button/add-member-button.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEdit } from '@fortawesome/free-regular-svg-icons';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { NextEpisodesComponent } from './components/next-episodes/next-episodes.component';
import { AnimesProgressComponent } from './components/animes-progress/animes-progress.component';

@Component({
  selector: 'app-shared-list',
  templateUrl: './shared-list.page.html',
  styleUrls: ['./shared-list.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    IonRow,
    IonGrid,
    IonCol,
    AddAnimeButtonComponent,
    AddMemberButtonComponent,
    FontAwesomeModule,
    LeaderboardComponent,
    NextEpisodesComponent,
    AnimesProgressComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
  ],
})
export class SharedListPage implements OnInit {
  authService = inject(AuthService);
  private sharedListsService = inject(SharedListsService);

  listInfo = this.sharedListsService.listInfo;

  isOwner = this.sharedListsService.isOwner;
  isEditor = this.sharedListsService.isEditor;
  isLeader = this.sharedListsService.isLeader;

  newMessage = this.listInfo()?.message!;

  faEdit = faEdit;
  faPlus = faPlus;

  constructor() {}

  ngOnInit() {}

  updateMessage() {
    if (this.newMessage === this.listInfo()?.message) return;

    this.sharedListsService
      .updateMessage(this.listInfo()?.id!, this.newMessage)
      .subscribe();
  }

  focusOnInput(inputElement: HTMLInputElement) {
    inputElement.focus();
  }
}
