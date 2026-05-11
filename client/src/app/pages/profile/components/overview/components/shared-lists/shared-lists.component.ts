import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { list } from 'node_modules/ionicons/icons';
import { map, share, tap } from 'rxjs';
import {
  SharedList,
  SharedListInfo,
  SharedListResApi,
} from 'src/app/models/SharedList';
import { APIService } from 'src/app/services/apiservice';
import { AuthService } from 'src/app/services/auth-service';
import { SharedListComponent } from './components/shared-list/shared-list.component';

@Component({
  selector: 'app-profile-shared-lists',
  templateUrl: './shared-lists.component.html',
  styleUrls: ['./shared-lists.component.scss'],
  imports: [RouterLink, SharedListComponent],
})
export class SharedListsComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(APIService);
  sharedLists = signal<SharedListInfo[]>([]);

  constructor() {
    effect(() => {
      if (this.authService.user()) {
        this.loadSharedList();
      }
    });
  }

  loadSharedList() {
    this.apiService
      .get<SharedListResApi>(`shared-lists/${this.authService.user()!.id}`)
      .pipe(
        tap((val) => {
          console.log(val);
        }),
        map(({ data }) => {
          return data.map(({ sharedList, members }) => {
            return {
              sharedList: {
                id: sharedList.shared_list_id,
                name: sharedList.shared_list_name,
                message: sharedList.message,
                userId: sharedList.user_id,
                role: sharedList.role,
              } as SharedList,
              members: members.map((member) => {
                return {
                  userId: member.user_id,
                  username: member.username,
                  avatar: member.avatar,
                  role: member.role,
                  totalEpisodes: member.total_episodes,
                };
              }),
              sharedListMembersNumber: members[0].length,
            } as SharedListInfo;
          });
        }),
      )

      .subscribe((res) => {
        this.sharedLists.set(res);
      });
  }

  ngOnInit() {}
}
