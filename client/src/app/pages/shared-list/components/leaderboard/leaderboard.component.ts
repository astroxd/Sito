import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton,
  AlertController,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { SharedListMember, SharedListRole } from 'src/app/models/SharedList';
import { AuthService } from 'src/app/services/auth-service';
import { SharedListsService } from 'src/app/services/shared-lists-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
  imports: [
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonButton,
    FontAwesomeModule,
  ],
})
export class LeaderboardComponent implements OnInit {
  private sharedListsService = inject(SharedListsService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);

  members = this.sharedListsService.members;
  pendingMembers = this.sharedListsService.pendingMembers;
  isOwner = this.sharedListsService.isOwner;
  listId = this.sharedListsService.listInfo()?.id!;

  faEllipsisV = faEllipsisV;
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

  async presentActionSheet(member: SharedListMember) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Actions',
      cssClass: 'actionsheet',

      buttons: [
        member.role === 'MEMBER'
          ? {
              text: 'Make Editor',
              cssClass: 'actionsheet-editor',
              handler: () => {
                this.changeRole(member.id, 'EDITOR');
              },
            }
          : {
              text: 'Demote to Member',
              cssClass: 'actionsheet-editor',
              handler: () => {
                this.changeRole(member.id, 'MEMBER');
              },
            },
        {
          text: 'Kick',
          role: 'destructive',
          cssClass: 'actionsheet-kick',
          handler: () => {
            this.removeMember(member.id);
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
          data: {
            action: 'cancel',
          },
        },
      ],
    });

    await actionSheet.present();
  }

  leave() {
    this.sharedListsService
      .removeMember(this.listId, this.authService.user()?.id!, true)
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
