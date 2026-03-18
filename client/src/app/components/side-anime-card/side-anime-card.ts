import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { Anime } from '../../models/Anime';

@Component({
  selector: 'app-side-anime-card',
  imports: [FontAwesomeModule],
  templateUrl: './side-anime-card.html',
  styleUrl: './side-anime-card.css',
})
export class SideAnimeCard {
  faEye = faEye;
  anime = input.required<Anime>();
}
