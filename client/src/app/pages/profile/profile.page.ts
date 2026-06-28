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
import { RouterOutlet } from '@angular/router';
import { SharedListsService } from 'src/app/services/shared-lists-service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonGrid,
    RouterOutlet,
  ],
})
export class ProfilePage implements OnInit {
  private sharedListsService = inject(SharedListsService);
  constructor() {}

  ngOnInit() {}

  ionViewWillEnter() {
    //* Refresh every components data
    this.sharedListsService.loadSharedLists().subscribe();
    this.sharedListsService.loadInvites().subscribe();
  }
}
