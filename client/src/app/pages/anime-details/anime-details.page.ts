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
    IonRouterOutlet,
    AsyncPipe,
    RouterOutlet,
    IonButtons,
    IonBackButton,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AnimeDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  AnimeDetailsService = inject(AnimeDetails);

  details$: any;
  animeId: string | null;

  constructor() {
    this.animeId = this.route.snapshot.paramMap.get('id');

    if (this.animeId) {
      this.details$ = this.AnimeDetailsService.GetAnimeDetails(this.animeId);
    }
  }

  ngOnInit() {}
}
