import { Component, input, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Anime } from 'src/app/models/Anime';
import { ListedAnime } from '../../models/List';
import { getEpisodes } from 'src/app/helpers/formattedAnimeDetails';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye } from '@fortawesome/free-regular-svg-icons';

@Component({
  selector: 'app-anime-card',
  imports: [RouterLink, FontAwesomeModule],
  templateUrl: './anime-card.html',
  styleUrl: './anime-card.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AnimeCard {
  anime = input<Anime | undefined>();
  listedAnime = input<ListedAnime | undefined>();
  getEpisodes = getEpisodes;
  faEye = faEye;
  constructor() {}
}
