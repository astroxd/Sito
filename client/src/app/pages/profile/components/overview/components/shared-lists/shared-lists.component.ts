import {
  Component,
  effect,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  SharedListInfo,
  SharedListInvitation,
} from 'src/app/models/SharedList';

import { AuthService } from 'src/app/services/auth-service';
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
  private authService = inject(AuthService);
  private sharedListsService = inject(SharedListsService);
  sharedLists = signal<SharedListInfo[]>([]);
  sharedListInvitations = signal<SharedListInvitation[]>([]);

  constructor() {
    effect(() => {
      if (this.authService.user()) {
        this.loadSharedList();
        this.loadInvites();
      }
    });
  }

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
    this.sharedListsService
      .createSharedList(this.name)
      .pipe(
        finalize(() => {
          this.loadSharedList();
        }),
      )
      .subscribe();
  }

  loadSharedList() {
    this.sharedListsService.loadSharedLists().subscribe((sharedListsInfo) => {
      this.sharedLists.set(sharedListsInfo);
    });
  }

  loadInvites() {
    this.sharedListsService.loadInvites().subscribe((data) => {
      console.log(data.data);
      this.sharedListInvitations.set(data.data);
    });
  }

  reloadSharedListsAndInvites() {
    this.loadSharedList();
    this.loadInvites();
  }
  ngOnInit() {}
}
