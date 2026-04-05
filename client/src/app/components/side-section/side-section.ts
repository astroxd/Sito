import { Component, input } from '@angular/core';
import { SideAnimeCard } from '../side-anime-card/side-anime-card';
import { Anime } from '../../models/Anime';
@Component({
  selector: 'app-side-section',
  imports: [SideAnimeCard],
  templateUrl: './side-section.html',
  styleUrl: './side-section.scss',
})
export class SideSection {
  sectionName = input.required<string>();
  animes = input.required<Anime[]>();
  link = input.required<string>();
}
