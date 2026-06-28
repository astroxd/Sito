import { inject, Injectable, signal } from '@angular/core';
import { APIService } from './apiservice';
import {
  FoundUsersApiRes,
  FriendsResponse,
  FriendUser,
  FriendUsersApiRes,
  PendingFriendUser,
} from '../models/Friendship';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FriendshipService {
  private apiService = inject(APIService);

  public friends = signal<FriendUser[]>([]);
  public pendingRequest = signal<PendingFriendUser[]>([]);

  loadFriendsAndRequests() {
    return this.apiService.get<FriendsResponse>('friends').pipe(
      tap({
        next: ({ data: friendsResponse }) => {
          this.friends.set(friendsResponse.accepted);
          this.pendingRequest.set(friendsResponse.pending);
        },
        error: (err) => {
          console.log(err);
        },
      }),
    );
  }

  searchFriends(name = '', page = 1) {
    return this.apiService.get<FoundUsersApiRes>(
      `friends/search?q=${name}&page=${page}`,
    );
  }

  searchAmongFriends(name = '', page = 1) {
    return this.apiService.get<FriendUsersApiRes>(
      `friends/my/search?q=${name}&page=${page}`,
    );
  }

  addFriend(friendId: number) {
    return this.apiService
      .post<{ message: string }>('friends/request', {
        receiverUserId: friendId,
      })
      .pipe(
        tap({
          next: () => {
            this.loadFriendsAndRequests().subscribe();
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  acceptFriend(senderUserId: number) {
    return this.apiService
      .post<{ message: string }>('friends/accept', {
        senderUserId,
      })
      .pipe(
        tap({
          next: () => {
            this.loadFriendsAndRequests().subscribe();
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  declineFriend(friendId: number) {
    return this.apiService
      .delete<{ message: string }>(`friends/decline/${friendId}`)
      .pipe(
        tap({
          next: () => {
            this.loadFriendsAndRequests().subscribe();
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }

  removeFriend(friendId: number) {
    return this.apiService
      .delete<{ message: string }>(`friends/remove/${friendId}`)
      .pipe(
        tap({
          next: () => {
            this.loadFriendsAndRequests().subscribe();
          },
          error: (err) => {
            console.log(err);
          },
        }),
      );
  }
}
