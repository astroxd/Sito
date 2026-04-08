import { Component, input, OnInit } from '@angular/core';
import { IonRow, IonCol, IonGrid } from '@ionic/angular/standalone';

@Component({
  selector: 'app-character-card',
  templateUrl: './character-card.component.html',
  styleUrls: ['./character-card.component.scss'],
  imports: [IonRow, IonCol, IonGrid],
})
export class CharacterCardComponent implements OnInit {
  character = input.required<any>();
  constructor() {}

  ngOnInit() {}
}
