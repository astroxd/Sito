import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { IonInfiniteScrollCustomEvent } from '@ionic/core';
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
  IonAvatar,
  IonLabel,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
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
  private sharedListService = inject(SharedListsService);
  private friendshipService = inject(FriendshipService);

  listId = this.sharedListService.listInfo()?.id!;
  members = this.sharedListService.members;
  pendingMember = this.sharedListService.pendingMembers;

  membersSet = computed(
    () => new Set(this.members().map((member) => member.id)),
  );

  pendingMembersSet = computed(
    () => new Set(this.pendingMember().map((member) => member.userId)),
  );

  searchedFriends = signal<FriendUser[]>([]);

  private searchSubject = new Subject<string>();

  @ViewChild(IonModal) modal!: IonModal;

  name = '';
  private page: number = 1;

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async openModal() {
    this.searchFriends('');
    this.modal.present();

    const dismiss = this.modal.onDidDismiss();
    dismiss.finally(() => {
      this.name = '';
      this.page = 1;
      this.searchedFriends.set([]);
    });
  }

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.page = 1;
        this.searchFriends(query, this.page, true);
      });
  }

  ngOnInit() {}

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  searchFriends(
    query: string,
    page = 1,
    isNewQuery = false,
    infiniteEvent?: IonInfiniteScrollCustomEvent<void>,
  ) {
    this.friendshipService.searchAmongFriends(query.trim(), page).subscribe({
      next: ({ data: foundFriends, hasNextPage }) => {
        if (isNewQuery) {
          this.searchedFriends.set(foundFriends.items);
        } else {
          this.searchedFriends.update((currentFriends) => [
            ...currentFriends,
            ...foundFriends.items,
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
    this.searchFriends(this.name, ++this.page, false, $event);
  }

  invite(invitedUserId: number) {
    this.sharedListService.inviteMember(this.listId, invitedUserId).subscribe();
  }
}
