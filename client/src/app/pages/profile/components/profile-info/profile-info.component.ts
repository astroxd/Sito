import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonRouterLinkWithHref } from '@ionic/angular/standalone';
import { User } from 'src/app/models/User';
import { AuthService } from 'src/app/services/auth-service';

@Component({
  selector: 'app-profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonRouterLinkWithHref],
})
export class ProfileInfoComponent implements OnInit {
  public bannerImage =
    'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg';
  UserService = inject(AuthService);

  user = signal<User | undefined | null>(undefined);

  constructor() {
    this.user = this.UserService.user;
  }

  ngOnInit() {}
}
