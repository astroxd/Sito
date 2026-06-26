import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { IonInfiniteScrollCustomEvent } from '@ionic/core';
import {
  IonModal,
  ModalController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonList,
  IonAvatar,
  IonLabel,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';
import { SharedListsService } from 'src/app/services/shared-lists-service';
import { FriendUser } from 'src/app/models/Friendship';
import { FriendshipService } from 'src/app/services/friendship-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-member-button',
  templateUrl: './add-member-button.component.html',
  styleUrls: ['./add-member-button.component.scss'],
  imports: [
    FormsModule,
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
    IonAvatar,
    IonLabel,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
})
export class AddMemberButtonComponent implements OnInit {
  onAdd = output();
  sharedListId = input<number>();
  sharedListMembers = input(new Set<number>());
  sharedListInvited = input(new Set<number>());

  sharedListService = inject(SharedListsService);
  friendshipService = inject(FriendshipService);
  modalController = inject(ModalController);

  @ViewChild(IonModal) modal!: IonModal;

  name!: string;

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async openModal() {
    this.searchFriends('');
    this.modal.present();

    const dismiss = this.modal.onDidDismiss();
    dismiss.finally(() => {
      this.name = '';
      this.searchedFriends.set([]);
      this.query = '';
      this.page = 1;
    });
  }

  private searchSubject = new Subject<string>();

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  private query: string = '';
  private page: number = 1;

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.query = query;
        this.page = 1;
        this.searchFriends(query, this.page, true);
      });
  }

  searchedFriends = signal<FriendUser[]>([]);

  searchFriends(
    query: string,
    page = 1,
    isNewQuery = false,
    infiniteEvent?: IonInfiniteScrollCustomEvent<void>,
  ) {
    console.log(query);

    this.friendshipService.searchAmongFriends(query.trim(), page).subscribe({
      next: ({ data, hasNextPage }) => {
        const foundFriends = data;
        console.log(data);

        if (isNewQuery) {
          this.searchedFriends.set(foundFriends);
        } else {
          this.searchedFriends.update((currentFriends) => [
            ...currentFriends,
            ...foundFriends,
          ]);
        }

        if (infiniteEvent && !hasNextPage) {
          infiniteEvent.target.disabled = true;
        }
      },
      error: (err) => {
        console.log('Error', err);
      },
      complete: () => {
        if (infiniteEvent) {
          infiniteEvent.target.complete();
        }
      },
    });
  }

  onIonInfinite($event: IonInfiniteScrollCustomEvent<void>) {
    this.searchFriends(this.query, ++this.page, false, $event);
  }

  invite(invitedUserId: number) {
    this.sharedListService
      .inviteMember(this.sharedListId()!, invitedUserId)
      .pipe(finalize(() => this.onAdd.emit()))
      .subscribe();
  }

  ngOnInit() {}
}
