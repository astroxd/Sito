import { Component, inject, input, OnInit, ViewEncapsulation } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons';
import { AnimeCard } from '../anime-card/anime-card';
import { GetAnimes } from '../../get-animes';
import { Anime } from '../../models/Anime';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-section',
  imports: [FontAwesomeModule, AnimeCard, RouterLink],
  templateUrl: './section.html',
  styleUrl: './section.css',
  encapsulation: ViewEncapsulation.None,
})
export class Section implements OnInit {
  faLongArrowAltRight = faLongArrowAltRight;
  sectionName = input.required<string>();
  animes = input.required<Anime[]>();
  link = input.required<string>();

  ngOnInit(): void {}
}
