import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton,
  AlertController,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { SharedListRole } from 'src/app/models/SharedList';
import { AuthService } from 'src/app/services/auth-service';
import { SharedListsService } from 'src/app/services/shared-lists-service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
  imports: [IonList, IonItem, IonAvatar, IonLabel, IonButton],
})
export class LeaderboardComponent implements OnInit {
  private sharedListsService = inject(SharedListsService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private alertController = inject(AlertController);

  members = this.sharedListsService.members;
  pendingMembers = this.sharedListsService.pendingMembers;
  isOwner = this.sharedListsService.isOwner;
  listId = this.sharedListsService.listInfo()?.id!;

  constructor() {}

  ngOnInit() {}

  async confirmListDestruction() {
    const alert = await this.alertController.create({
      header: 'Confirm',

      message:
        'Warning: You are the only member left. Leaving this shared list will <strong>permanently delete it</strong>. Do you want to proceed?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete & Leave',
          role: 'destructive',

          handler: () => {
            this.leave();
          },
        },
      ],
    });

    await alert.present();
  }

  leave() {
    this.sharedListsService
      .removeMember(this.listId, this.authService.user()?.id!)
      .pipe(
        finalize(() => {
          this.router.navigate(['/profile']);
        }),
      )
      .subscribe();
  }

  removeMember(memberId: number) {
    this.sharedListsService.removeMember(this.listId, memberId).subscribe();
  }

  changeRole(memberId: number, newRole: SharedListRole) {
    this.sharedListsService
      .updateMemberRole(this.listId, memberId, newRole)
      .subscribe();
  }

  cancelInvite(userId: number) {
    this.sharedListsService.cancelInvite(this.listId, userId).subscribe();
  }
}
