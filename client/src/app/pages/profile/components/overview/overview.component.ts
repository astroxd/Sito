import { Component, OnInit } from '@angular/core';
import { IonRow, IonCol } from '@ionic/angular/standalone';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';
import { ListsComponent } from './components/lists/lists.component';
import { SharedListsComponent } from './components/shared-lists/shared-lists.component';
import { BadgesComponent } from './components/badges/badges.component';
import { FriendListComponent } from './components/friend-list/friend-list.component';

@Component({
  selector: 'app-profile-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  imports: [
    IonRow,
    IonCol,
    ProfileInfoComponent,
    ListsComponent,
    SharedListsComponent,
    BadgesComponent,
    FriendListComponent,
  ],
})
export class OverviewComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
