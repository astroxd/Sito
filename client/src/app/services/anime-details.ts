import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { Anime } from '../models/Anime';
import {
  AnimeDetail,
  AnimeRecommendation,
  AnimeTag,
} from '../models/AnimeDetails';

@Injectable({
  providedIn: 'root',
})
export class AnimeDetails {
  private http = inject(HttpClient);

  private readonly url = 'https://graphql.anilist.co';

  GetAnimeDetails(animeId: string) {
    const query = {
      query: `
        query($id: Int){
            Media(id: $id){
                id
                idMal
                title{
                    english
                    romaji
                    native
                }
                description(asHtml: false)
                format
                studios{
                    nodes{
                        name
                    }
                }
                startDate{
                    year
                    month
                    day
                }
                endDate{
                    year
                    month
                    day
                }
                status
                genres
                averageScore
                popularity
                duration
                coverImage{
                    extraLarge
                    large
                }
                favourites
                episodes
                nextAiringEpisode{
                    airingAt 
                }
            }
        }

    `,
      variables: { id: animeId },
    };
    return this.http.post<any>(this.url, query).pipe(
      tap(({ data }) => console.log(data.Media)),
      map(({ data: { Media } }) => Media),
    ) as Observable<AnimeDetail>;
  }

  GetAnimeTags(animeId: string) {
    const query = {
      query: `
        query($id: Int){
            Media(id: $id){
                tags{
                    id
                    name
                }
            }
        }

    `,
      variables: { id: animeId },
    };

    return this.http.post<any>(this.url, query).pipe(
      tap(({ data }) => console.log(data)),
      map(({ data: { Media } }) => Media.tags),
    ) as Observable<AnimeTag>;
  }

  GetAnimeRecommendations(animeId: string) {
    const query = {
      query: `
        query($id: Int){
            Media(id: $id){
                recommendations(sort: RATING_DESC, perPage: 5) {
                    edges {
                          node {
                            mediaRecommendation {
                                  id
                                title {
                                    english
                                    romaji
                                 }
                                coverImage {
                                    extraLarge
                                }
                                bannerImage
                                episodes
                                popularity
                                nextAiringEpisode{
                                    episode
                                }
                                status
                            }
                          }
                    }
                }
            }
        }
    `,
      variables: { id: animeId },
    };

    return this.http.post<any>(this.url, query).pipe(
      tap(({ data }) => console.log(data)),
      map(({ data: { Media } }) => Media.recommendations?.edges),
    ) as Observable<AnimeRecommendation>;
  }

  GetAnimeCharacters(animeId: string, page = 1) {
    const query = {
      query: `
        query($id: Int, $pageNumber: Int){
				Media(id: $id){
					characters(sort: [RELEVANCE, FAVOURITES_DESC], page: $pageNumber) {
						pageInfo {
							hasNextPage
						}
						edges{
							node {
							  name {
								first
								middle
								last
							  }
							  image{
								large
							  }
							}
							role
							voiceActors(language:JAPANESE) {
							  name {
								full
							  }
							  image{
								large
							  }
							  languageV2
							}

						}
					}
				}
			}

    `,
      variables: { id: animeId, pageNumber: page },
    };

    return this.http.post<any>(this.url, query).pipe(
      tap(({ data }) => console.log(data)),
      map(({ data: { Media } }) => Media.characters),
    );
  }

  GetAnimeEpisodes(MALAnimeId: number, page = 1) {
    const query = `https://api.jikan.moe/v4/anime/${MALAnimeId}/videos/episodes?page=${page}`;

    return this.http.get<any>(query).pipe(tap((data) => console.log(data)));
  }
}
