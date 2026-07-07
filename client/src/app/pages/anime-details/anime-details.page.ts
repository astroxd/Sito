import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRouterOutlet,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';

import { AnimeDescription } from './components/description/anime-description.component';
import { AnimeDetails } from 'src/app/services/anime-details';
import { AsyncPipe } from '@angular/common';
import { ListsService } from 'src/app/services/lists-service';
import { SharedListsService } from 'src/app/services/shared-lists-service';
import { AuthService } from 'src/app/services/auth-service';

@Component({
  selector: 'app-anime-details',
  templateUrl: './anime-details.page.html',
  styleUrls: ['./anime-details.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    AnimeDescription,
    IonGrid,
    AsyncPipe,
    RouterOutlet,
    IonButtons,
    IonBackButton,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AnimeDetailsPage implements OnInit {
  private authService = inject(AuthService);
  private listsService = inject(ListsService);
  private sharedListsService = inject(SharedListsService);
  private route = inject(ActivatedRoute);
  AnimeDetailsService = inject(AnimeDetails);

  details$: any;
  animeId: number | null = null;

  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.animeId = Number(params.get('id'));

      if (this.animeId && !isNaN(this.animeId)) {
        this.details$ = this.AnimeDetailsService.GetAnimeDetails(this.animeId);
        if (this.authService.user()) {
          this.listsService.getListedAnime(Number(this.animeId)).subscribe();
          this.sharedListsService
            .getSharedListsWithAnimeId(this.animeId)
            .subscribe();
        }
      }
    });
  }

  ngOnInit() {}
}
