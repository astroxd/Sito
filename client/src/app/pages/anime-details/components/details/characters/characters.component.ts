import { Component, inject, OnInit, Signal, signal } from '@angular/core';
import { Router, ROUTER_OUTLET_DATA, RouterLink } from '@angular/router';
import {
  IonRow,
  IonCol,
  IonRouterLinkWithHref,
  InfiniteScrollCustomEvent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { AnimeDetails } from 'src/app/services/anime-details';
import { CharacterCardComponent } from './character-card/character-card.component';
import { finalize, map } from 'rxjs';
import {
  AnimeCharacter,
  AnimeCharacterApiRes,
} from 'src/app/models/AnimeDetails';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-characters',
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.scss'],
  imports: [
    IonRow,
    IonCol,
    CharacterCardComponent,
    RouterLink,
    IonRouterLinkWithHref,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    FontAwesomeModule,
  ],
})
export class Characters implements OnInit {
  outletData = inject(ROUTER_OUTLET_DATA) as Signal<{ id: number }>;
  public router = inject(Router);
  private AnimeDetailsService = inject(AnimeDetails);

  public characters = signal<AnimeCharacter[]>([]);

  private animeId;
  public isFullPage = false;

  private page = 1;

  faLongArrowAltRight = faLongArrowAltRight;

  constructor() {
    this.isFullPage = this.router.url.endsWith('characters');
    this.animeId = this.outletData().id;

    this.loadCharacters();
  }

  ngOnInit() {}

  loadCharacters(event?: InfiniteScrollCustomEvent) {
    this.AnimeDetailsService.GetAnimeCharacters(this.animeId, this.page)
      .pipe(
        finalize(() => {
          if (event) {
            event.target.complete();
          }
        }),
        map((res: AnimeCharacterApiRes) => {
          return {
            characters: res.edges.map(
              ({ node: { image, name }, role, voiceActors }) => {
                const character: AnimeCharacter = {
                  image,
                  name,
                  role,
                  voiceActors,
                };
                return character;
              },
            ),
            pageInfo: res.pageInfo,
          };
        }),
      )
      .subscribe({
        next: (newCharactersInfo) => {
          this.characters.update((characters) => [
            ...characters,
            ...newCharactersInfo.characters,
          ]);
          if (event) {
            event.target.disabled = !newCharactersInfo.pageInfo.hasNextPage;
          }
        },
        complete: () => {
          if (event) {
            event.target.complete();
          }
        },
      });
  }

  loadMore(event: InfiniteScrollCustomEvent) {
    this.page++;
    this.loadCharacters(event);
  }
}
