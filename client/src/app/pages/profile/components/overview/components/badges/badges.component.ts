import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { UserBadge, UserBadgeResApi } from 'src/app/models/Badge';
import { APIService } from 'src/app/services/apiservice';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonIcon,
  IonButton,
  IonContent,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonProgressBar,
  IonBadge,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-badges',
  templateUrl: './badges.component.html',
  styleUrls: ['./badges.component.scss'],
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonIcon,
    IonButton,
    IonContent,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonCardTitle,
    IonProgressBar,
    IonBadge,
  ],
})
export class BadgesComponent implements OnInit {
  private apiService = inject(APIService);

  badges = signal<UserBadge[]>([]);
  public isLoading = signal<boolean>(true);

  @ViewChild(IonModal) modal!: IonModal;

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async openModal() {
    this.modal.present();
  }

  constructor() {
    this.apiService.get<UserBadgeResApi>('my-badges').subscribe((data) => {
      console.log(data.data);
      this.badges.set(data.data);
      this.isLoading.set(false);
    });
  }

  ngOnInit() {}
}
