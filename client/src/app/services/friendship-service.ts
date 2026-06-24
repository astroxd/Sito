import { inject, Injectable } from '@angular/core';
import { APIService } from './apiservice';
import { FoundUsersApiRes, FriendsResponse } from '../models/Friendship';

@Injectable({
  providedIn: 'root',
})
export class FriendshipService {
  private apiService = inject(APIService);

  getFriends() {
    return this.apiService.get<FriendsResponse>('friends');
  }

  searchFriends(name = '', page = 1) {
    return this.apiService.get<FoundUsersApiRes>(
      `friends/search?q=${name}&page=${page}`,
    );
  }

  addFriend(friendId: number) {
    return this.apiService.post<{ message: string }>('friends/request', {
      receiverUserId: friendId,
    });
  }

  acceptFriend(senderUserId: number) {
    return this.apiService.post<{ message: string }>('friends/accept', {
      senderUserId,
    });
  }

  declineFriend(friendId: number) {
    return this.apiService.delete<{ message: string }>(
      `friends/decline/${friendId}`,
    );
  }
}
