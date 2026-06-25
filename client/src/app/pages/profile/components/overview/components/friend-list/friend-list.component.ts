import {
  Component,
  computed,
  effect,
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
  IonIcon,
} from '@ionic/angular/standalone';
import { IonInfiniteScrollCustomEvent } from '@ionic/core';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  Subject,
  tap,
} from 'rxjs';
import {
  FoundUser,
  FriendUser,
  PendingFriendUser,
  FriendshipRequestStatus,
} from 'src/app/models/Friendship';
import { AuthService } from 'src/app/services/auth-service';
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
    IonIcon,
  ],
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.scss'],
})
export class FriendListComponent implements OnInit {
  private authService = inject(AuthService);
  private friendshipService = inject(FriendshipService);

  pendingRequests = signal<PendingFriendUser[]>([]);
  friends = signal<FriendUser[]>([]);

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

  private query: string = '';
  private page: number = 1;

  @ViewChild(IonModal) modal!: IonModal;

  name!: string;

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
      this.query = '';
      this.page = 1;
    });
  }

  private searchSubject = new Subject<string>();

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  constructor() {
    effect(() => {
      this.loadFriendsAndRequest();
    });

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.query = query;
        this.page = 1;
        this.searchUsers(query, this.page, true);
      });
  }

  loadFriendsAndRequest() {
    if (this.authService.user()) {
      console.log('Loading');
      this.friendshipService.getFriends().subscribe(({ data }) => {
        console.log(data);
        this.pendingRequests.set(data.pending);
        this.friends.set(data.accepted);
      });
    }
  }

  searchUsers(
    query: string,
    page = 1,
    isNewQuery = false,
    infiniteEvent?: IonInfiniteScrollCustomEvent<void>,
  ) {
    console.log(query);

    this.friendshipService.searchFriends(query.trim(), page).subscribe({
      next: ({ data, hasNextPage }) => {
        const foundUsers = data;

        if (isNewQuery) {
          this.searchedUsers.set(foundUsers);
        } else {
          this.searchedUsers.update((currentUsers) => [
            ...currentUsers,
            ...foundUsers,
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
    this.searchUsers(this.query, ++this.page, false, $event);
  }

  ngOnInit() {}

  sendFriendRequest(newFriendId: number) {
    this.friendshipService
      .addFriend(newFriendId)
      .pipe(
        finalize(() => this.loadFriendsAndRequest()),
        tap((res) => {
          console.log(res.message);
        }),
      )
      .subscribe();
  }

  acceptFriendRequest(senderUserId: number) {
    this.friendshipService
      .acceptFriend(senderUserId)
      .pipe(
        finalize(() => this.loadFriendsAndRequest()),
        tap((res) => {
          console.log(res.message);
        }),
      )
      .subscribe();
  }

  declineFriendRequest(newFriendId: number) {
    this.friendshipService
      .declineFriend(newFriendId)
      .pipe(
        finalize(() => this.loadFriendsAndRequest()),
        tap((res) => {
          console.log(res.message);
        }),
      )
      .subscribe();
  }

  removeFriend(friendId: number) {
    this.friendshipService
      .removeFriend(friendId)
      .pipe(
        finalize(() => this.loadFriendsAndRequest()),
        tap((res) => {
          console.log(res.message);
        }),
      )
      .subscribe();
  }
}
