import { Component, input, OnInit } from '@angular/core';
import { IonRow, IonCol } from '@ionic/angular/standalone';
import { Anime } from 'src/app/models/Anime';

@Component({
  selector: 'app-section-with-search',
  templateUrl: './section-with-search.component.html',
  styleUrls: ['./section-with-search.component.scss'],
  imports: [IonRow, IonCol],
})
export class SectionWithSearchComponent implements OnInit {
  public readonly sectionTitle = input.required();
  public animes = input.required<Anime[]>();

  constructor() {}

  ngOnInit() {}
}
