import { Component, input } from '@angular/core';
import { IonRow, IonCol } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';
import { AnimeCard } from '../anime-card/anime-card';
import { Anime } from '../../models/Anime';
import { Params, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons';
export interface NavigationTarget {
  url: string | any[];
  params?: Params;
}

@Component({
  selector: 'app-section',
  imports: [AnimeCard, RouterLink, IonRow, IonCol, FontAwesomeModule],
  templateUrl: './section.html',
  styleUrl: './section.scss',
})
export class Section {
  sectionName = input.required<string>();
  animes = input.required<Anime[]>();
  navigationTarget = input.required<NavigationTarget>();
  faLongArrowAltRight = faLongArrowAltRight;

  constructor() {
    addIcons({ arrowForwardOutline });
  }
}
