import { inject, Injectable } from '@angular/core';
import { APIService } from './apiservice';
import { AuthService } from './auth-service';
import {
  SharedList,
  SharedListAnimeProgressResApi,
  SharedListInfo,
  SharedListInvitationResApi,
  SharedListResApi,
  SharedListUserProgressResApi,
} from '../models/SharedList';
import { map, tap } from 'rxjs';
import { Anime } from '../models/Anime';
import { AnimeDetail } from '../models/AnimeDetails';
import { FoundUser } from '../models/Friendship';
import { list } from 'ionicons/icons';

@Injectable({
  providedIn: 'root',
})
export class SharedListsService {
  private apiService = inject(APIService);

  loadSharedLists() {
    return this.apiService.get<SharedListResApi>('shared-lists').pipe(
      tap((val) => {
        console.log(val.data);
      }),
      map(({ data }) => {
        return data.map(({ sharedList, members }) => {
          return {
            sharedList,
            members,
            sharedListMembersNumber: members[0].length,
          } as SharedListInfo;
        });
      }),
    );
  }

  loadInvites() {
    return this.apiService.get<SharedListInvitationResApi>(
      'shared-lists/invite',
    );
  }

  createSharedList(sharedListName: string) {
    return this.apiService.post('shared-list', { name: sharedListName });
  }

  loadSharedList(sharedListId: number) {
    return this.apiService
      .get<{ data: SharedList }>(`shared-list/${sharedListId}`)
      .pipe(
        tap((val) => {
          console.log(val);
        }),
      );
  }

  getPendingMembers(sharedListId: number) {
    return this.apiService.get<{ data: FoundUser[] }>(
      `shared-list/${sharedListId}/pending`,
    );
  }

  getUserSharedAnimeProgress(sharedListId: number) {
    return this.apiService
      .get<SharedListUserProgressResApi>(`shared-list/${sharedListId}/animes`)
      .pipe(
        tap((val) => {
          console.log(val);
        }),
      );
  }

  getSharedAnimesProgress(sharedListId: number) {
    return this.apiService
      .get<SharedListAnimeProgressResApi>(
        `shared-list/${sharedListId}/animes/all`,
      )
      .pipe(
        tap((val) => {
          console.log(val);
        }),
      );
  }

  addAnimeToSharedList(sharedListId: number, anime: Anime) {
    const {
      id,
      idMal,
      title,
      coverImage,
      nextAiringEpisode,
      episodes,
      duration,
      status,
    } = anime;

    return this.apiService
      .post<{ message: string }>(`shared-list/${sharedListId}/entrie`, {
        animeDetails: {
          id,
          idMal,
          title: title.romaji ?? title.english ?? 'NO TITLE',
          coverImage: coverImage?.extraLarge ?? coverImage?.large,
          episodes:
            nextAiringEpisode?.episode ??
            (status === 'FINISHED' && !nextAiringEpisode ? episodes : 0),
          duration: duration ?? 0,
        },
      })
      .pipe();
  }

  getSharedListsWithAnimeId(animeId: number) {
    return this.apiService.get<{
      data: {
        sharedListId: number;
        sharedListName: string;
        animeId?: number;
      }[];
    }>(`shared-list/entrie/${animeId}`);
  }

  inviteMember(listId: number, invitedUserId: number) {
    return this.apiService.post(`shared-list/${listId}/member`, {
      memberId: invitedUserId,
    });
  }

  acceptInvite(listId: number) {
    return this.apiService.post(`shared-list/${listId}/accept`, {});
  }

  declineInvite(listId: number) {
    return this.apiService.delete(`shared-list/${listId}/decline`);
  }

  cancelInvite(listId: number, invitedUserId: number) {
    return this.apiService.delete(
      `shared-list/${listId}/cancel/${invitedUserId}`,
    );
  }

  removeMember(listId: number, memberId: number) {
    return this.apiService.delete(`shared-list/${listId}/remove/${memberId}`);
  }
}
