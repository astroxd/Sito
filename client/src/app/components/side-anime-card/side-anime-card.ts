import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-side-anime-card',
  imports: [FontAwesomeModule],
  templateUrl: './side-anime-card.html',
  styleUrl: './side-anime-card.css',
})
export class SideAnimeCard {
  faEye = faEye;
  // anime: any = input.required();

  anime = {
    id: 3,
    title:
      'Jujustu Kakaisen cosaassurdalunghissima ciao prova ancopra pià di questa cosa lunghissima',
    image:
      'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx172463-LnXqHzt74SJL.jpg',
    popularity: 100000,
  };
}
