import { Component, input } from '@angular/core';
import { SideAnimeCard } from '../side-anime-card/side-anime-card';
import { Anime } from '../../models/Anime';
import { NavigationTarget } from '../section/section';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-side-section',
  imports: [SideAnimeCard, FontAwesomeModule, RouterLink],
  templateUrl: './side-section.html',
  styleUrl: './side-section.scss',
})
export class SideSection {
  sectionName = input.required<string>();
  animes = input.required<Anime[]>();
  navigationTarget = input.required<NavigationTarget>();

  faLongArrowAltRight = faLongArrowAltRight;
}
