import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { UserBadge, UserBadgeResApi } from 'src/app/models/Badge';
import { APIService } from 'src/app/services/apiservice';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
  IonBadge,
} from '@ionic/angular/standalone';
import { NgClass } from '@angular/common';

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
    IonButton,
    IonContent,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonProgressBar,
    IonBadge,
    NgClass,
  ],
})
export class BadgesComponent implements OnInit {
  private apiService = inject(APIService);

  badges = signal<UserBadge[]>([]);
  unlockedBadges = signal<UserBadge[]>([]);
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
      this.badges.set(data.data);

      this.unlockedBadges.set(
        data.data
          .sort((a, b) => {
            if (a.unlockedAt && b.unlockedAt) {
              return (
                new Date(b.unlockedAt).getTime() -
                new Date(a.unlockedAt).getTime()
              );
            }
            if (a.unlockedAt) return -1;
            if (b.unlockedAt) return 1;
            return 0;
          })
          .slice(0, 3),
      );

      this.isLoading.set(false);
    });
  }

  ngOnInit() {}

  handleBadgeImageError(event: ErrorEvent) {
    const element = event.target as HTMLImageElement;
    element.onerror = null;

    element.src = 'assets/default/badge_default.png';
  }
}
