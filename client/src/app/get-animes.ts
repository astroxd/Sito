import { inject, Injectable } from '@angular/core';
import { Anime } from './models/Anime';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetAnimes {
  private http = inject(HttpClient);

  constructor() {
    // this.fetchAnime();
  }
  private query = {
    query: `
query($page: Int, $perPage: Int){
                Page(page: $page, perPage: $perPage){
                    media (type: ANIME, sort: TRENDING_DESC){
                        id
                        title{
                            english
                            romaji
                        }
                        episodes
                        nextAiringEpisode{
                            episode
                        }
                        popularity
                        coverImage{
                            large
                        }
                        genres
                        status
                    }
                }
            }
`,
    variables: { page: 1, perPage: 10 },
  };

  // Define our query variables and values that will be used in the query request
  private variables = {
    page: 1,
    perPage: 10,
  };

  // Define the config we'll need for our Api request
  private url = 'https://graphql.anilist.co';
  private options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: this.query,
      variables: this.variables,
    }),
  };

  fetchAnime() {
    console.log(this.options);

    return this.http.post<any>(this.url, this.query).pipe(
      tap(({ data: { Page } }) => console.log(Page.media)),
      map(
        ({
          data: {
            Page: { media },
          },
        }) => media,
        // media.map((anime: any) => {
        //   console.log(anime);
        //   return {
        //     id: anime.mal_id,
        //     title: anime.title,
        //     image: anime.coverImage.large,
        //     popularity: anime.popularity,
        //   };
        // }),
      ),
    ) as Observable<Anime>;

    return this.http.get<any>('https://api.jikan.moe/v4/seasons/now?limit=12').pipe(
      map(({ data }) =>
        data.map((anime: any) => {
          console.log(anime);
          return {
            id: anime.mal_id,
            title: anime.title,
            image: anime.images.jpg.large_image_url,
            popularity: anime.popularity,
          };
        }),
      ),
    ) as Observable<Anime>;
  }

  GetAnime() {
    // if (this.Animes.length <= 1) {
    //   this.fetchAnime();
    // }
    this.fetchAnime();
  }
}
