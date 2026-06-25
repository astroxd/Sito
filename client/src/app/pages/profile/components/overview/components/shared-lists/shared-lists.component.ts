import {
  Component,
  effect,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { list } from 'ionicons/icons';
import { finalize, map, pipe, share, tap } from 'rxjs';
import {
  SharedList,
  SharedListInfo,
  SharedListInvitation,
  SharedListResApi,
} from 'src/app/models/SharedList';
import { APIService } from 'src/app/services/apiservice';
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
  IonList,
  IonLabel,
  IonListHeader,
  IonAvatar,
  IonIcon,
} from '@ionic/angular/standalone';
import { OverlayEventDetail } from '@ionic/core/components';
import { SharedListsService } from 'src/app/services/shared-lists-service';
import { SharedListInvitationComponent } from './components/shared-list-invitation/shared-list-invitation.component';
@Component({
  selector: 'app-profile-shared-lists',
  templateUrl: './shared-lists.component.html',
  styleUrls: ['./shared-lists.component.scss'],
  imports: [
    FormsModule,
    RouterLink,
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
    IonList,
    IonLabel,
    IonListHeader,
    IonAvatar,
    IonIcon,
    SharedListInvitationComponent,
  ],
})
export class SharedListsComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(APIService);
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
    this.name = '';
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

    this.name = '';
  }

  onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
    if (event.detail.role === 'confirm') {
      // this.message = `Hello, ${event.detail.data}!`;
      console.log('testmodal' + this.name);
    }
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
    console.log('reload');
    this.loadSharedList();
    this.loadInvites();
  }
  ngOnInit() {}
}
