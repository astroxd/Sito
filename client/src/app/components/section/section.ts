import { Component, input, ViewEncapsulation } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons';
import { AnimeCard } from '../anime-card/anime-card';
import { Anime } from '../../models/Anime';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-section',
  imports: [FontAwesomeModule, AnimeCard, RouterLink],
  templateUrl: './section.html',
  styleUrl: './section.css',
  encapsulation: ViewEncapsulation.None,
})
export class Section {
  faLongArrowAltRight = faLongArrowAltRight;
  sectionName = input.required<string>();
  animes = input.required<Anime[]>();
  link = input.required<string>();
}
