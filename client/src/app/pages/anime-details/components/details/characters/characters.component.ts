import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonRow, IonCol, IonFab } from '@ionic/angular/standalone';
import { AnimeDetails } from 'src/app/services/anime-details';
import { CharacterCardComponent } from './character-card/character-card.component';
import { tap } from 'rxjs';

@Component({
  selector: 'app-characters',
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.scss'],
  imports: [IonRow, IonCol, CharacterCardComponent],
})
export class Characters implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private AnimeDetailsService = inject(AnimeDetails);
  isFullPage = false;

  characters = signal([] as any[]);

  constructor() {
    this.isFullPage = this.router.url.endsWith('characters');

    const animeId = this.route.snapshot.paramMap.get('id');

    if (animeId) {
      this.AnimeDetailsService.GetAnimeCharacters(animeId).subscribe(
        (character) =>
          // console.log(character),
          this.characters.set([...this.characters(), ...character]),
      );
    }
    effect(() => {
      console.log(this.characters());
    });
  }

  ngOnInit() {
    console.log(this.router.url);
  }
}
