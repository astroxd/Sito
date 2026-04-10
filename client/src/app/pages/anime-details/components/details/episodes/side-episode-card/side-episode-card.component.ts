import { Component, input, OnInit } from '@angular/core';
import { AnimeEpisode } from 'src/app/models/AnimeDetails';

@Component({
  selector: 'app-side-episode-card',
  templateUrl: './side-episode-card.component.html',
  styleUrls: [
    '../../../../../../components/side-anime-card/side-anime-card.scss',
    './side-episode-card.component.scss',
  ],
})
export class SideEpisodeCardComponent implements OnInit {
  episode = input.required<AnimeEpisode>();
  constructor() {}

  ngOnInit() {}
}
