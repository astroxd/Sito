import { Component, input } from '@angular/core';
import { Anime } from '../../models/Anime';

@Component({
  selector: 'app-side-anime-card',
  imports: [],
  templateUrl: './side-anime-card.html',
  styleUrl: './side-anime-card.scss',
})
export class SideAnimeCard {
  anime = input.required<Anime>();
}
