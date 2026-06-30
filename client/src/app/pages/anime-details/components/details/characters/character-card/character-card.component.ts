import { Component, input, OnInit } from '@angular/core';
import { AnimeCharacter } from 'src/app/models/AnimeDetails';
import { getCharacterName } from 'src/app/helpers/formattedAnimeDetails';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-character-card',
  templateUrl: './character-card.component.html',
  styleUrls: ['./character-card.component.scss'],
  imports: [FontAwesomeModule],
})
export class CharacterCardComponent implements OnInit {
  character = input.required<AnimeCharacter>();
  getCharacterName = getCharacterName;

  faCaretLeft = faCaretLeft;
  faCaretRight = faCaretRight;
  constructor() {}

  ngOnInit() {}
}
