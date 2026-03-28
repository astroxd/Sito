import { Component, input } from '@angular/core';
import { Observable } from 'rxjs';
import { Anime } from '../../../../models/Anime';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { AnimeCard } from '../../../../components/anime-card/anime-card';

@Component({
  selector: 'app-search-results',
  imports: [AsyncPipe, AnimeCard, JsonPipe],
  templateUrl: './search-results.html',
  styleUrl: './search-results.css',
})
export class SearchResults {
  anime = input.required<[] | null>();
  constructor() {
    console.log(this.anime);
  }
}
