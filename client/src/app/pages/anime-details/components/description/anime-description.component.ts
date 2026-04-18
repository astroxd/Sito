import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { IonRow, IonCol } from '@ionic/angular/standalone';

import { AnimeDetail } from 'src/app/models/AnimeDetails';
import {
  getDateAired,
  getStatus,
  getAiringEpisode,
} from 'src/app/helpers/formattedAnimeDetails';
import { AddToWatchlistButtonComponent } from './components/add-to-watchlist-button/add-to-watchlist-button.component';

@Component({
  selector: 'app-anime-description',
  templateUrl: './anime-description.component.html',
  styleUrls: ['./anime-description.component.scss'],
  imports: [IonRow, IonCol, AddToWatchlistButtonComponent],
})
export class AnimeDescription implements OnInit {
  public details = input<AnimeDetail | null>(null);

  public titles = computed<string>(() => {
    return Object.entries(this.details()?.title ?? [])
      .map(([, value]) => value)
      .join(', ');
  });

  public studios = computed<string>(() => {
    return (
      this.details()
        ?.studios.nodes.map((a) => a.name)
        ?.join(', ') ?? ''
    );
  });

  public genres = computed<string>(
    () =>
      this.details()
        ?.genres.map((genre) => genre)
        ?.join(', ') ?? '',
  );

  getDateAired = getDateAired;
  getStatus = getStatus;
  getAiringEpisode = getAiringEpisode;

  public showDescription: boolean = false;

  constructor() {}

  ngOnInit() {}

  setShowDescription(show: boolean) {
    this.showDescription = show;
  }
}
