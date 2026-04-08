import { Component, input, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Anime } from '../../models/Anime';
import { getEpisodes } from 'src/app/helpers/formattedAnimeDetails';
@Component({
  selector: 'app-anime-card',
  imports: [RouterLink],
  templateUrl: './anime-card.html',
  styleUrl: './anime-card.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AnimeCard {
  anime = input.required<Anime>();
  getEpisodes = getEpisodes;
  constructor() {
    // console.log(this.anime());
  }

  // anime = {
  //   id: 3,
  //   title: 'Jujustu Kakaisen cosaassurdalunghissima ciao prova ancopra pià',
  //   image:
  //     'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx172463-LnXqHzt74SJL.jpg',
  //   popularity: 100000,
  // };
}
