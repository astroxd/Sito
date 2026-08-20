import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import {
  AnimeCharacterApiRes,
  AnimeDetail,
  AnimeEpisodeApiRes,
  AnimeRecommendation,
  AnimeTag,
} from '../models/AnimeDetails';
import { APIService } from './apiservice';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class AnimeDetails {
  private http = inject(HttpClient);
  private apiService = inject(APIService);
  private authService = inject(AuthService);
  private readonly url = 'https://graphql.anilist.co';

  public animeDetails = signal<AnimeDetail | null>(null);

  GetAnimeDetails(animeId: number) {
    this.apiService.get<AnimeDetail>(`anime/details/${animeId}`).subscribe({
      next: (details) => {
        this.animeDetails.set(details);
      },
      error: (err) => {
        console.log(err);
        this.animeDetails.set(null);
      },
    });

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
                  episode
                  airingAt
                }
            }
        }

    `,
      variables: { id: animeId },
    };
    return;

    //TODO fix sync

    return this.http.post<any>(this.url, query).pipe(
      map(({ data: { Media } }) => Media),
      tap((media) => {
        const animePayload = {
          id: media.id,
          idMal: media.idMal,
          title:
            media.title.romaji ??
            media.title.english ??
            media.title.native ??
            'NO TITLE',
          coverImage: media.coverImage.extraLarge ?? media.coverImage.large,
          duration: media.duration,
          episodes: media.nextAiringEpisode?.episode
            ? media.nextAiringEpisode.episode - 1
            : (media.episodes ?? 0),
          genres: media.genres,
        };

        if (this.authService.user()) {
          this.apiService
            .post('anime/sync', { anime: animePayload })
            .subscribe();
          this.apiService.get(`anime/details/${animeId}`).subscribe({
            next: (data: any) => {
              console.log(data);
            },
          });
        }
      }),
    ) as Observable<AnimeDetail>;
  }

  GetAnimeRecommendations(animeId: number) {
    return this.apiService.get<AnimeRecommendation[]>(
      `anime/details/${animeId}/recommendations`,
    );
  }

  GetAnimeCharacters(animeId: number, page = 1) {
    return this.apiService.get<AnimeCharacterApiRes>(
      `anime/details/${animeId}/characters/${page}`,
    );
  }

  GetAnimeEpisodes(MALAnimeId: number, page = 1) {
    return this.apiService.get<AnimeEpisodeApiRes>(
      `anime/details/${MALAnimeId}/episodes/${page}`,
    );
  }
}
