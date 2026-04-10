import { Component, OnInit } from '@angular/core';
import { IonCol, IonRow } from '@ionic/angular/standalone';
import { Tags } from './tags.component';
import { Recommendations } from './recommendations.component';
import { Characters } from './characters/characters.component';
import { Episodes } from './episodes/episodes.component';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
  imports: [IonCol, IonRow, Tags, Recommendations, Characters, Episodes],
})
export class Details implements OnInit {
  constructor() {}

  ngOnInit() {}
}
