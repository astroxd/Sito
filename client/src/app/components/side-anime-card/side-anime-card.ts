import { Component, input } from '@angular/core';

import { Anime } from '../../models/Anime';
import { getEpisodes } from 'src/app/helpers/formattedAnimeDetails';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye } from '@fortawesome/free-regular-svg-icons';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-side-anime-card',
  imports: [FontAwesomeModule, RouterLink],
  templateUrl: './side-anime-card.html',
  styleUrl: './side-anime-card.scss',
})
export class SideAnimeCard {
  anime = input.required<Anime>();
  getEpisodes = getEpisodes;
  faEye = faEye;
}
