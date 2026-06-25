import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonRow,
  IonGrid,
  IonCol,
  IonProgressBar,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonList,
  IonAvatar,
  IonModal,
  IonButtons,
  IonButton,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth-service';
import { APIService } from 'src/app/services/apiservice';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  share,
  Subject,
  tap,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  SharedList,
  SharedListAnimeProgress,
  SharedListInfo,
  SharedListRole,
  SharedListUserProgress,
} from 'src/app/models/SharedList';
import { SharedListsService } from 'src/app/services/shared-lists-service';
import { AddAnimeButtonComponent } from './components/add-anime-button/add-anime-button.component';
import { AddMemberButtonComponent } from './components/add-member-button/add-member-button.component';
import { FoundUser } from 'src/app/models/Friendship';

@Component({
  selector: 'app-shared-list',
  templateUrl: './shared-list.page.html',
  styleUrls: ['./shared-list.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonRow,
    IonGrid,
    IonCol,
    IonProgressBar,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonList,
    IonAvatar,

    IonButton,
    AddAnimeButtonComponent,
    AddMemberButtonComponent,
  ],
})
export class SharedListPage implements OnInit {
  authService = inject(AuthService);
  private apiService = inject(APIService);
  private sharedListsService = inject(SharedListsService);
  private activeRoute = inject(ActivatedRoute);
  private router = inject(Router);

  onAdd = output();

  listId: number | undefined;

  //* General information of the shared list
  sharedList = signal<SharedList | undefined>(undefined);

  //* Shared animes with progress of current member
  userSharedAnimesProgress = signal<SharedListUserProgress[]>([]);

  //* Shared animes with progress of all member
  sharedListAnimes = signal<SharedListAnimeProgress[]>([]);

  invitedMembers = signal<FoundUser[]>([]);

  invitedMembersSet = computed(
    () => new Set(this.invitedMembers().map((member) => member.userId)),
  );

  sharedListAnimesSet = computed(
    () =>
      new Set(
        this.sharedListAnimes().map(
          (animeProgress) => animeProgress.anime.animeId,
        ),
      ),
  );

  sharedListMembersSet = computed(
    () => new Set(this.sharedList()?.members.map((member) => member.id)),
  );

  isOwner = computed(
    () =>
      this.sharedList()?.members.find((m) => m.role === 'OWNER')?.id ===
      this.authService.user()?.id,
  );

  ownerId = computed(
    () => this.sharedList()?.members.find((m) => m.role === 'OWNER')?.id,
  );

  isEditor = computed(
    () =>
      this.sharedList()?.members.find(
        (m) => m.id === this.authService.user()?.id,
      )?.role === 'EDITOR',
  );

  isLeader = computed(
    () => this.sharedList()?.members[0].id === this.authService.user()?.id,
  );

  listMessage = '';

  constructor() {
    //TODO togli effect tanto se sono qui sono loggato
    effect(() => {
      if (this.authService.user()) {
        this.activeRoute.params.subscribe((params) => {
          this.listId = params['listId'];
          if (this.listId) {
            this.loadSharedList();
            this.loadData();
          }
        });
      }
    });
  }

  loadData() {
    this.getSharedAnimesProgress();
    this.getUserSharedAnimeProgress();
  }

  ngOnInit() {}

  loadSharedList() {
    this.sharedListsService
      .loadSharedList(this.listId!)
      .subscribe(({ data: sharedList }) => {
        console.log(sharedList);
        this.sharedList.set(sharedList);
        this.listMessage = sharedList.message ?? '';
      });
    this.getPendingMembers();
  }

  getPendingMembers() {
    this.sharedListsService
      .getPendingMembers(this.listId!)
      .subscribe(({ data: data }) => {
        console.log(data);
        this.invitedMembers.set(data);
      });
  }

  getSharedAnimesProgress() {
    this.sharedListsService
      .getSharedAnimesProgress(this.listId!)
      .subscribe(({ data }) => {
        this.sharedListAnimes.set(data);
      });
  }

  getUserSharedAnimeProgress() {
    this.sharedListsService
      .getUserSharedAnimeProgress(this.listId!)
      .subscribe(({ data }) => {
        this.userSharedAnimesProgress.set(data);
      });
  }

  addEpisode(userProgress: SharedListUserProgress) {
    this.apiService
      .post(
        `shared-list/${this.listId}/progress/entrie/${userProgress.animeId}`,
        {},
      )
      .pipe(
        tap((val) => {
          console.log(val);
        }),
        finalize(() => {
          this.loadData();
        }),
      )
      .subscribe((res: any) => {
        // this.userSharedAnimesProgress.set(res.data);
      });
  }

  removeMember(memberId: number) {
    this.sharedListsService
      .removeMember(this.listId!, memberId)
      .pipe(
        finalize(() => {
          this.loadData();
          this.loadSharedList();
        }),
      )
      .subscribe();
  }

  cancelInvite(userId: number) {
    this.sharedListsService
      .cancelInvite(this.listId!, userId)
      .pipe(
        finalize(() => {
          this.loadData();
          this.loadSharedList();
        }),
      )
      .subscribe();
  }

  leave() {
    this.sharedListsService
      .removeMember(this.listId!, this.authService.user()?.id!)
      .pipe(
        finalize(() => {
          console.log('Navitae');
          this.router.navigate(['/profile']);
        }),
      )
      .subscribe();
  }
  changeRole(memberId: number, newRole: SharedListRole) {
    this.sharedListsService
      .updateMemberRole(this.listId!, memberId, newRole)
      .pipe(finalize(() => this.loadSharedList()))
      .subscribe();
  }

  updateMessage() {
    if (this.listMessage === this.sharedList()?.message) return;

    this.sharedListsService
      .updateMessage(this.listId!, this.listMessage)
      .subscribe();
  }

  focusOnInput(inputElement: HTMLInputElement) {
    inputElement.focus();
  }
}
