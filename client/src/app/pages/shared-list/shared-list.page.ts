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
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth-service';
import { APIService } from 'src/app/services/apiservice';
import { finalize, map, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SharedList, SharedListInfo } from 'src/app/models/SharedList';

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
  ],
})
export class SharedListPage implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(APIService);
  private activeRoute = inject(ActivatedRoute);

  private listId: number | undefined;

  sharedList = signal<SharedList | undefined>(undefined);

  constructor() {
    effect(() => {
      if (this.authService.user()) {
        this.activeRoute.params.subscribe((params) => {
          this.listId = params['listId'];
          if (this.listId) {
            this.checkUser();
            this.getSharedAnimes();
            this.getUserSharedAnimeProgress();
          }
        });
      }
    });
  }

  ngOnInit() {}

  checkUser() {
    // console.log(this.activeRoute.snapshot.paramMap);
    // const listId = this.activeRoute.snapshot.paramMap.get('listId');

    this.apiService
      .get<{
        data: {
          shared_list_id: number;
          shared_list_name: string;
          message?: string;
          user_id: number;
          role: number;
        };
      }>(`shared-list/${this.authService.user()!.id}/${this.listId}`)
      .pipe(
        tap((val) => {
          console.log(val);
        }),
        map(({ data: sharedList }) => {
          return {
            id: sharedList.shared_list_id,
            name: sharedList.shared_list_name,
            message: sharedList.message,
            userId: sharedList.user_id,
            role: sharedList.role,
          } as SharedList;
        }),
      )
      .subscribe((res) => {
        this.sharedList.set(res);
      });
  }

  sharedListAnimes = signal<any[]>([]);

  getSharedAnimes() {
    this.apiService
      .get(
        `shared-list/${this.authService.user()!.id}/${this.listId}/animes/all`,
      )
      .pipe(
        tap((val) => {
          console.log(val);
        }),
      )
      .subscribe((res: any) => {
        this.sharedListAnimes.set(res.data);
      });
  }

  userSharedAnimesProgress = signal<any[]>([]);

  getUserSharedAnimeProgress() {
    this.apiService
      .get(`shared-list/${this.authService.user()!.id}/${this.listId}/animes`)
      .pipe(
        tap((val) => {
          console.log(val);
        }),
      )
      .subscribe((res: any) => {
        this.userSharedAnimesProgress.set(res.data);
      });
  }

  addEpisode(animeProgress: any) {
    this.apiService
      .post(
        `shared-list/${this.authService.user()!.id}/${this.listId}/progress/entrie/${animeProgress.anime_id}`,
        {},
      )
      .pipe(
        tap((val) => {
          console.log(val);
        }),
        finalize(() => this.getUserSharedAnimeProgress()),
      )
      .subscribe((res: any) => {
        // this.userSharedAnimesProgress.set(res.data);
      });
  }
}
