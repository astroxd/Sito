import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonRouterLinkWithHref } from '@ionic/angular/standalone';

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
  private authService = inject(AuthService);

  user = this.authService.user;

  constructor() {}
  ngOnInit() {}

  logout() {
    this.authService.logout().subscribe();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      this.authService.updateAvatar(file).subscribe();
    }
  }
}
