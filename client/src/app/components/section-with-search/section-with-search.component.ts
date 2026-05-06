import { Component, input, OnInit, output } from '@angular/core';
import { IonRow, IonCol } from '@ionic/angular/standalone';
import { Anime, ListedAnime } from 'src/app/models/Anime';
import { AnimeCard } from '../anime-card/anime-card';

@Component({
  selector: 'app-section-with-search',
  templateUrl: './section-with-search.component.html',
  styleUrls: ['./section-with-search.component.scss'],
  imports: [IonRow, IonCol, AnimeCard],
})
export class SectionWithSearchComponent implements OnInit {
  public readonly sectionTitle = input.required();
  public animes = input.required<ListedAnime[]>();
  public hasNextPage = input(false);

  private page = 1;
  showMore = output<number>();
  constructor() {}

  loadMore() {
    this.showMore.emit(++this.page);
  }

  ngOnInit() {}
}
