import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons';
import { SideAnimeCard } from '../side-anime-card/side-anime-card';
import { Anime } from '../../models/Anime';
@Component({
  selector: 'app-side-section',
  imports: [FontAwesomeModule, SideAnimeCard],
  templateUrl: './side-section.html',
  styleUrl: './side-section.css',
})
export class SideSection {
  faLongArrowAltRight = faLongArrowAltRight;
  sectionName = input.required<string>();
  animes = input.required<Anime[]>();
  link = input.required<string>();
}
