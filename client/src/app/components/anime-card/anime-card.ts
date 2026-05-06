import { Component, input, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Anime, ListedAnime } from '../../models/Anime';
import { getEpisodes } from 'src/app/helpers/formattedAnimeDetails';
@Component({
  selector: 'app-anime-card',
  imports: [RouterLink],
  templateUrl: './anime-card.html',
  styleUrl: './anime-card.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AnimeCard {
  [x: string]: any;
  anime = input<Anime | undefined>();
  listedAnime = input<ListedAnime | undefined>();
  getEpisodes = getEpisodes;
  constructor() {}
}
