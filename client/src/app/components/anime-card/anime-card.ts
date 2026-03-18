import { Component, input, ViewEncapsulation } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { Anime } from '../../models/Anime';
@Component({
  selector: 'app-anime-card',
  imports: [FontAwesomeModule],
  templateUrl: './anime-card.html',
  styleUrl: './anime-card.css',
  encapsulation: ViewEncapsulation.None,
})
export class AnimeCard {
  faEye = faEye;
  anime = input.required<Anime>();

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
