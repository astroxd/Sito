import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SharedListComponent } from './components/shared-list/shared-list.component';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
} from '@ionic/angular/standalone';
import { SharedListsService } from 'src/app/services/shared-lists-service';
import { SharedListInvitationComponent } from './components/shared-list-invitation/shared-list-invitation.component';
@Component({
  selector: 'app-profile-shared-lists',
  templateUrl: './shared-lists.component.html',
  styleUrls: ['./shared-lists.component.scss'],
  imports: [
    FormsModule,
    SharedListComponent,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    SharedListInvitationComponent,
  ],
})
export class SharedListsComponent implements OnInit {
  private sharedListsService = inject(SharedListsService);

  sharedLists = this.sharedListsService.userSharedLists;
  sharedListInvitations = this.sharedListsService.userInvitations;

  constructor() {}

  @ViewChild(IonModal) modal!: IonModal;
  name!: string;
  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async openModal() {
    this.modal.present();

    const dismiss = this.modal.onDidDismiss();
    dismiss.finally(() => {
      this.name = '';
    });
  }

  confirm() {
    this.modal.dismiss(this.name, 'confirm');
    this.sharedListsService.createSharedList(this.name).subscribe();
  }

  ngOnInit() {}
}
