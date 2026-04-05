import { Component, input } from '@angular/core';
import { IonIcon, IonRow, IonCol } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';
import { AnimeCard } from '../anime-card/anime-card';
import { Anime } from '../../models/Anime';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-section',
  imports: [AnimeCard, RouterLink, IonIcon, IonRow, IonCol],
  templateUrl: './section.html',
  styleUrl: './section.scss',
})
export class Section {
  sectionName = input.required<string>();
  animes = input.required<Anime[]>();
  link = input.required<string>();

  constructor() {
    addIcons({ arrowForwardOutline });
  }
}
