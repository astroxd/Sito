import { computed, inject, Injectable, signal } from '@angular/core';
import { APIService } from './apiservice';

import {
  SharedList,
  SharedListAnimeProgress,
  SharedListAnimeProgressResApi,
  SharedListInfo,
  SharedListInvitationResApi,
  SharedListMember,
  SharedListResApi,
  SharedListRole,
  SharedListUserProgress,
  SharedListUserProgressResApi,
} from '../models/SharedList';
import { map, share, tap } from 'rxjs';
import { Anime } from '../models/Anime';

import { FoundUser } from '../models/Friendship';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class SharedListsService {
  private apiService = inject(APIService);
  private authService = inject(AuthService);

  //* General information of the shared list
  public listInfo = signal<SharedList | null>(null);

  public members = signal<SharedListMember[]>([]);
  public pendingMembers = signal<FoundUser[]>([]);

  //* Shared animes with progress of current member
  public userAnimesProgress = signal<SharedListUserProgress[]>([]);

  //* Shared animes with progress of all member
  public sharedListAnimes = signal<SharedListAnimeProgress[]>([]);

  isOwner = computed(
    () =>
      this.members().find((m) => m.role === 'OWNER')?.id ===
      this.authService.user()?.id,
  );

  ownerId = computed(() => this.members().find((m) => m.role === 'OWNER')?.id);

  isEditor = computed(
    () =>
      this.members().find((m) => m.id === this.authService.user()?.id)?.role ===
      'EDITOR',
  );

  canEditAnime = computed(() => this.isEditor() || this.isOwner());

  isLeader = computed(() =>
    this.members().length > 0
      ? this.members()[0].id === this.authService.user()?.id
      : false,
  );

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
        tap({
          next: ({ data: sharedList }) => {
            this.listInfo.set(sharedList);
            this.members.set(sharedList.members);

            this.getPendingMembers(sharedListId);

            this.getUserSharedAnimeProgress(sharedListId);
            this.getSharedAnimesProgress(sharedListId);
          },
          error: (err) => {
            console.error(err);
          },
        }),
      );
  }

  loadSharedListLeaderboard(sharedListId: number) {
    this.apiService
      .get<{ data: SharedList }>(`shared-list/${sharedListId}`)
      .subscribe({
        next: ({ data: sharedList }) => {
          this.listInfo.set(sharedList);
          this.members.set(sharedList.members);
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  getPendingMembers(sharedListId: number) {
    this.apiService
      .get<{ data: FoundUser[] }>(`shared-list/${sharedListId}/pending`)
      .subscribe({
        next: ({ data: pendingMembers }) => {
          this.pendingMembers.set(pendingMembers);
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  getUserSharedAnimeProgress(sharedListId: number) {
    this.apiService
      .get<SharedListUserProgressResApi>(`shared-list/${sharedListId}/animes`)
      .pipe(
        tap((val) => {
          console.log(val);
        }),
      )
      .subscribe({
        next: ({ data: userProgress }) => {
          this.userAnimesProgress.set(userProgress);
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  getSharedAnimesProgress(sharedListId: number) {
    this.apiService
      .get<SharedListAnimeProgressResApi>(
        `shared-list/${sharedListId}/animes/all`,
      )
      .pipe(
        tap((val) => {
          console.log(val);
        }),
      )
      .subscribe({
        next: ({ data: animesProgress }) => {
          this.sharedListAnimes.set(animesProgress);
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  updateUserAnimeProgress(sharedListId: number, animeId: number) {
    return this.apiService
      .post(`shared-list/${sharedListId}/progress/entrie/${animeId}`, {})
      .pipe(
        tap({
          next: () => {
            this.loadSharedListLeaderboard(sharedListId);
            this.getUserSharedAnimeProgress(sharedListId);
            this.getSharedAnimesProgress(sharedListId);
          },
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
      genres,
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
          genres,
        },
      })
      .pipe(
        tap({
          next: () => {
            this.getUserSharedAnimeProgress(sharedListId);
            this.getSharedAnimesProgress(sharedListId);
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  removeAnimeFromSharedList(sharedListId: number, animeId: number) {
    return this.apiService
      .delete(`shared-list/${sharedListId}/entrie/${animeId}`)
      .pipe(
        tap({
          next: () => {
            this.getUserSharedAnimeProgress(sharedListId);
            this.getSharedAnimesProgress(sharedListId);
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
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

  inviteMember(sharedListId: number, invitedUserId: number) {
    return this.apiService
      .post(`shared-list/${sharedListId}/member`, {
        memberId: invitedUserId,
      })
      .pipe(
        tap({
          next: () => {
            this.getPendingMembers(sharedListId);
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  acceptInvite(listId: number) {
    return this.apiService.post(`shared-list/${listId}/accept`, {});
  }

  declineInvite(listId: number) {
    return this.apiService.delete(`shared-list/${listId}/decline`);
  }

  cancelInvite(sharedListId: number, invitedUserId: number) {
    return this.apiService
      .delete(`shared-list/${sharedListId}/cancel/${invitedUserId}`)
      .pipe(
        tap({
          next: () => {
            this.getPendingMembers(sharedListId);
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  removeMember(sharedListId: number, memberId: number) {
    return this.apiService
      .delete(`shared-list/${sharedListId}/remove/${memberId}`)
      .pipe(
        tap({
          next: () => {
            this.loadSharedListLeaderboard(sharedListId);
            this.getSharedAnimesProgress(sharedListId);
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  updateMemberRole(
    sharedListId: number,
    memberId: number,
    newRole: SharedListRole,
  ) {
    return this.apiService
      .patch(`shared-list/${sharedListId}/member/${memberId}/role`, {
        newRole,
      })
      .pipe(
        tap({
          next: () => {
            this.loadSharedListLeaderboard(sharedListId);
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  updateMessage(sharedListId: number, newMessage: string) {
    return this.apiService
      .patch(`shared-list/${sharedListId}/message`, {
        message: newMessage,
      })
      .pipe(
        tap({
          next: () => {},
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }
}
