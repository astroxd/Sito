import { Component, effect, inject, OnInit, signal } from '@angular/core';
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
  ],
})
export class SharedListPage implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(APIService);
  private sharedListsService = inject(SharedListsService);
  private activeRoute = inject(ActivatedRoute);

  private listId: number | undefined;

  sharedList = signal<SharedList | undefined>(undefined);

  constructor() {
    //TODO togli effect tanto se sono qui sono loggato
    effect(() => {
      if (this.authService.user()) {
        this.activeRoute.params.subscribe((params) => {
          this.listId = params['listId'];
          if (this.listId) {
            this.loadSharedList();
            this.getSharedAnimesProgress();
            this.getUserSharedAnimeProgress();
          }
        });
      }
    });
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

  sharedListAnimes = signal<SharedListAnimeProgress[]>([]);

  getSharedAnimesProgress() {
    this.sharedListsService
      .getSharedAnimesProgress(this.listId!)
      .subscribe(({ data }) => {
        this.sharedListAnimes.set(data);
      });
  }

  userSharedAnimesProgress = signal<SharedListUserProgress[]>([]);

  getUserSharedAnimeProgress() {
    this.sharedListsService
      .getUserSharedAnimeProgress(this.listId!)
      .subscribe(({ data }) => {
        this.userSharedAnimesProgress.set(data);
      });
  }

  addEpisode(animeProgress: any) {
    // this.apiService
    //   .post(
    //     `shared-list/${this.authService.user()!.id}/${this.listId}/progress/entrie/${animeProgress.anime_id}`,
    //     {},
    //   )
    //   .pipe(
    //     tap((val) => {
    //       console.log(val);
    //     }),
    //     finalize(() => this.getUserSharedAnimeProgress()),
    //   )
    //   .subscribe((res: any) => {
    //     // this.userSharedAnimesProgress.set(res.data);
    //   });
  }
}
