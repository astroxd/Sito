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
import { finalize, map, share, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import {
  SharedList,
  SharedListAnimeProgress,
  SharedListInfo,
  SharedListUserProgress,
} from 'src/app/models/SharedList';
import { SharedListsService } from 'src/app/services/shared-lists-service';
import { AddAnimeButtonComponent } from './components/add-anime-button/add-anime-button.component';

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
    IonButtons,
    IonButton,
    IonModal,
    AddAnimeButtonComponent,
  ],
})
export class SharedListPage implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(APIService);
  private sharedListsService = inject(SharedListsService);
  private activeRoute = inject(ActivatedRoute);

  onAdd = output();

  listId: number | undefined;

  //* General information of the shared list
  sharedList = signal<SharedList | undefined>(undefined);

  //* Shared animes with progress of current member
  userSharedAnimesProgress = signal<SharedListUserProgress[]>([]);

  //* Shared animes with progress of all member
  sharedListAnimes = signal<SharedListAnimeProgress[]>([]);

  sharedListAnimesSet = computed(
    () =>
      new Set(
        this.sharedListAnimes().map(
          (animeProgress) => animeProgress.anime.animeId,
        ),
      ),
  );

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
          this.getUserSharedAnimeProgress();
          this.getSharedAnimesProgress();
        }),
      )
      .subscribe((res: any) => {
        // this.userSharedAnimesProgress.set(res.data);
      });
  }
}
