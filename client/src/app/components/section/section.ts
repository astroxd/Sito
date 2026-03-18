import { Component, inject, input, OnInit, ViewEncapsulation } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons';
import { AnimeCard } from '../anime-card/anime-card';
import { GetAnimes } from '../../get-animes';
import { Anime } from '../../models/Anime';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-section',
  imports: [FontAwesomeModule, AnimeCard, AsyncPipe],
  templateUrl: './section.html',
  styleUrl: './section.css',
  encapsulation: ViewEncapsulation.None,
})
export class Section implements OnInit {
  faLongArrowAltRight = faLongArrowAltRight;
  title = input.required<string>();

  AnimeService = inject(GetAnimes);

  animes: Anime[] = [];

  anime$: any;
  //  = this.AnimeService.fetchAnime();
  ngOnInit(): void {
    this.anime$ = this.AnimeService.fetchAnime();
    // this.animes = this.AnimeService.GetAnime();
  }
  // any[] = [
  //   {
  //     id: 3,
  //     title: 'Jujustu',
  //     image:
  //       'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx172463-LnXqHzt74SJL.jpg',
  //     popularity: 100000,
  //   },
  //   {
  //     id: 3,
  //     title: 'Jujustu',
  //     image:
  //       'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx172463-LnXqHzt74SJL.jpg',
  //     popularity: 100000,
  //   },
  //   {
  //     id: 3,
  //     title: 'Jujustu',
  //     image:
  //       'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx172463-LnXqHzt74SJL.jpg',
  //     popularity: 100000,
  //   },
  // ];
}
