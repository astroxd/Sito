import { inject, Injectable } from '@angular/core';
import { Anime } from '../models/Anime';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { getCurrentSeason, getNextSeason } from '../helpers/animeSeasons';
import { QueryOptions, SearchResultsData } from '../models/Search';
import { sortOptions } from '../helpers/animeSearchOptions';

@Injectable({
  providedIn: 'root',
})
export class GetAnimes {
  private http = inject(HttpClient);

  private readonly url = 'https://graphql.anilist.co';

  FetchAnime(query: Object) {
    return this.http.post<any>(this.url, query).pipe(
      tap(({ data: Page }) => console.log(Page.Page.media)),
      map(
        ({
          data: {
            Page: { media },
          },
        }) => media,
      ),
    ) as Observable<Anime[]>;
  }

  GetTrendingNowAnimes() {
    let query = {
      query: `
        query($page: Int, $perPage: Int){
          Page(page: $page, perPage: $perPage){
            media (type: ANIME, sort: TRENDING_DESC){
              id
              idMal
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
                extraLarge
              }
              genres
              status
            }
          }
        }
`,
      variables: { page: 1, perPage: 12 },
    };
    return this.FetchAnime(query);
  }
  GetPopularThisSeasonAnimes() {
    let query = {
      query: `
        query($page: Int, $perPage: Int, $seasonYear: Int, $season: MediaSeason){
          Page(page: $page, perPage: $perPage){
            media (seasonYear: $seasonYear, season: $season, type: ANIME, sort: POPULARITY_DESC){
              id
              idMal
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
                extraLarge
              }
              genres
              status
            }
          }
        }
`,
      variables: {
        page: 1,
        perPage: 12,
        seasonYear: new Date().getFullYear(),
        season: getCurrentSeason(),
      },
    };
    return this.FetchAnime(query);
  }
  GetNextSeasonAnimes() {
    let query = {
      query: `
        query($page: Int, $perPage: Int, $seasonYear: Int, $season: MediaSeason){
          Page(page: $page, perPage: $perPage){
            media (seasonYear: $seasonYear, season: $season, type: ANIME, sort: POPULARITY_DESC){
              id
              idMal
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
                extraLarge
              }
              genres
              status
            }
          }
        }
`,
      variables: {
        page: 1,
        perPage: 5,
        seasonYear: new Date().getFullYear(),
        season: getNextSeason(),
      },
    };
    return this.FetchAnime(query);
  }
  GetAllTimePopularAnimes() {
    let query = {
      query: `
        query($page: Int, $perPage: Int){
          Page(page: $page, perPage: $perPage){
            media (type: ANIME, sort: POPULARITY_DESC){
              id
              idMal
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
                extraLarge
              }
              bannerImage
              genres
              status
            }
          }
        }
`,
      variables: { page: 1, perPage: 5 },
    };
    return this.FetchAnime(query);
  }

  SearchAnime({
    page = 1,
    sort = sortOptions[0].name,
    searchOptions = {},
  }: QueryOptions) {
    let query = {
      query: `
    	query($page: Int, $perPage: Int, $search: String, $genre_in: [String], $seasonYear: Int, $season: MediaSeason, $format_in: [MediaFormat], $status_in: [MediaStatus], $sort: [MediaSort]){
            Page(page: $page, perPage: $perPage){
    			pageInfo{
    				total
    				perPage
            currentPage
    				lastPage
    				hasNextPage
    			}
            media (type: ANIME, search: $search, genre_in: $genre_in, seasonYear: $seasonYear, season: $season, format_in: $format_in, status_in: $status_in, sort: $sort){
                id
                idMal
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
                duration
            }
          }
        }

    `,
      variables: { page: page, perPage: 12, sort: sort, ...searchOptions },
    };

    console.log(sort);
    console.log(searchOptions);

    return this.http.post<any>(this.url, query).pipe(
      tap(({ data: Page }) => console.log(Page.Page.media)),
      map(({ data: { Page } }) => Page),
    ) as Observable<SearchResultsData>;
  }
}
