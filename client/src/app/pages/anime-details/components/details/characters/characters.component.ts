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
  ],
})
export class Characters implements OnInit {
  outletData = inject(ROUTER_OUTLET_DATA) as Signal<{ id: string }>;
  public router = inject(Router);
  private AnimeDetailsService = inject(AnimeDetails);

  public characters = signal<AnimeCharacter[]>([]);

  private animeId;
  public isFullPage = false;

  private page = 1;
  public isLoading = false;

  constructor() {
    this.isFullPage = this.router.url.endsWith('characters');
    this.animeId = this.outletData().id;

    this.loadCharacters();
  }

  ngOnInit() {}

  loadCharacters(event?: InfiniteScrollCustomEvent) {
    this.isLoading = true;
    this.AnimeDetailsService.GetAnimeCharacters(this.animeId, this.page)
      .pipe(
        finalize(() => {
          if (event) {
            event.target.complete();
            this.isLoading = false;
          }
        }),
        map((res: AnimeCharacterApiRes) => {
          this.characters.update((characters) => [
            ...characters,
            ...res.edges.map(({ node: { image, name }, role, voiceActors }) => {
              const character: AnimeCharacter = {
                image,
                name,
                role,
                voiceActors,
              };
              return character;
            }),
          ]);
          if (event) {
            event.target.disabled = !res.pageInfo.hasNextPage;
          }
        }),

        // catchError((err: any, caught) => {
        //   console.log(err);
        //   return;
        // }),
      )
      .subscribe();
  }

  loadMore(event: InfiniteScrollCustomEvent) {
    this.page++;
    this.loadCharacters(event);
  }

  // getParams = (route: any) => ({
  //   ...route.params,
  //   ...route.children.reduce(
  //     (acc: any, child: any) => ({ ...this.getParams(child), ...acc }),
  //     {},
  //   ),
  // });
}
