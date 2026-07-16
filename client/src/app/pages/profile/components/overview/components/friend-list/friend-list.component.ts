import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonAvatar,
} from '@ionic/angular/standalone';
import { IonInfiniteScrollCustomEvent } from '@ionic/core';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';
import { FoundUser, FriendshipRequestStatus } from 'src/app/models/Friendship';
import { FriendshipService } from 'src/app/services/friendship-service';

@Component({
  selector: 'app-friend-list',
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
    IonLabel,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonAvatar,
  ],
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.scss'],
})
export class FriendListComponent implements OnInit {
  private friendshipService = inject(FriendshipService);

  pendingRequests = this.friendshipService.pendingRequest;
  friends = this.friendshipService.friends;

  friendsAndPendingMap = computed(() => {
    const newMap = new Map<
      number,
      { status: FriendshipRequestStatus; isIncoming: boolean }
    >();

    this.friends().forEach((friend) => {
      newMap.set(friend.friendUserId, {
        status: 'ACCEPTED',
        isIncoming: false,
      });
    });

    this.pendingRequests().forEach((user) => {
      newMap.set(user.friendUserId, {
        status: 'PENDING',
        isIncoming: user.isIncoming,
      });
    });

    return newMap;
  });

  searchedUsers = signal<FoundUser[]>([]);
  private searchSubject = new Subject<string>();

  @ViewChild(IonModal) modal!: IonModal;

  name = '';
  private page: number = 1;

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.page = 1;
        this.searchUsers(query, this.page, true);
      });
  }
  ngOnInit() {}

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async openModal() {
    this.searchUsers('');
    this.modal.present();

    const dismiss = this.modal.onDidDismiss();
    dismiss.finally(() => {
      this.name = '';
      this.searchedUsers.set([]);
      this.page = 1;
    });
  }

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  searchUsers(
    query: string,
    page = 1,
    isNewQuery = false,
    infiniteEvent?: IonInfiniteScrollCustomEvent<void>,
  ) {
    this.friendshipService.searchFriends(query.trim(), page).subscribe({
      next: ({ data, hasNextPage }) => {
        const foundUsers = data;

        if (isNewQuery) {
          this.searchedUsers.set(foundUsers.items);
        } else {
          this.searchedUsers.update((currentUsers) => [
            ...currentUsers,
            ...foundUsers.items,
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
    this.searchUsers(this.name, ++this.page, false, $event);
  }

  sendFriendRequest(newFriendId: number) {
    this.friendshipService.addFriend(newFriendId).subscribe();
  }

  acceptFriendRequest(senderUserId: number) {
    this.friendshipService.acceptFriend(senderUserId).subscribe();
  }

  declineFriendRequest(newFriendId: number) {
    this.friendshipService.declineFriend(newFriendId).subscribe();
  }

  removeFriend(friendId: number) {
    this.friendshipService.removeFriend(friendId).subscribe();
  }
}
