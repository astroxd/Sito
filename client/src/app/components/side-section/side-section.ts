import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons';
import { SideAnimeCard } from '../side-anime-card/side-anime-card';
@Component({
  selector: 'app-side-section',
  imports: [FontAwesomeModule, SideAnimeCard],
  templateUrl: './side-section.html',
  styleUrl: './side-section.css',
})
export class SideSection {
  faLongArrowAltRight = faLongArrowAltRight;
  title = input.required<string>();

  animes: any[] = [
    {
      id: 3,
      title: 'Jujustu',
      image:
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx172463-LnXqHzt74SJL.jpg',
      popularity: 100000,
    },
    {
      id: 3,
      title: 'Jujustu',
      image:
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx172463-LnXqHzt74SJL.jpg',
      popularity: 100000,
    },
    {
      id: 3,
      title: 'Jujustu',
      image:
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx172463-LnXqHzt74SJL.jpg',
      popularity: 100000,
    },
  ];
}
