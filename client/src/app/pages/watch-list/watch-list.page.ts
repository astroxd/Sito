import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
} from '@ionic/angular/standalone';

import { AnimeStatus } from 'src/app/models/List';
import { ListComponent } from './components/list/list.component';
import { KeepWatchingComponent } from './components/keep-watching/keep-watching.component';
import { ListsService } from 'src/app/services/lists-service';

@Component({
  selector: 'app-watch-list',
  templateUrl: './watch-list.page.html',
  styleUrls: ['./watch-list.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonGrid,
    ListComponent,
    KeepWatchingComponent,
  ],
})
export class WatchListPage implements OnInit {
  public readonly AnimeStatus = AnimeStatus;
  private listsService = inject(ListsService);
  constructor() {}

  ngOnInit() {}

  ionViewWillEnter() {
    //* Refresh every components data
    this.listsService.loadListedAnimes();
    this.listsService.getUserProgress().subscribe();
  }
}
