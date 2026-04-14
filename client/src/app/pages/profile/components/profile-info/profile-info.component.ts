import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonRouterLinkWithHref } from '@ionic/angular/standalone';

@Component({
  selector: 'app-profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonRouterLinkWithHref],
})
export class ProfileInfoComponent implements OnInit {
  public bannerImage =
    'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg';

  constructor() {}

  ngOnInit() {}
}
