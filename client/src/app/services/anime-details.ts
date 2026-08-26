import { inject, Injectable, signal } from '@angular/core';
import {
  AnimeCharacterApiRes,
  AnimeDetail,
  AnimeEpisodeApiRes,
  AnimeRecommendation,
} from '../models/AnimeDetails';
import { APIService } from './apiservice';

@Injectable({
  providedIn: 'root',
})
export class AnimeDetails {
  private apiService = inject(APIService);

  public animeDetails = signal<AnimeDetail | null>(null);
  public isLoading = signal<boolean>(false);

  GetAnimeDetails(animeId: number) {
    this.animeDetails.set(null);
    this.isLoading.set(true);
    this.apiService.get<AnimeDetail>(`anime/details/${animeId}`).subscribe({
      next: (details) => {
        this.animeDetails.set(details);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.log(err);
        this.animeDetails.set(null);
        this.isLoading.set(false);
      },
    });
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
