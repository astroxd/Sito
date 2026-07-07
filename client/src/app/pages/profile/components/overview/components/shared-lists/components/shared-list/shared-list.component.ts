import { Component, input, OnInit } from '@angular/core';
import { SharedListInfo } from 'src/app/models/SharedList';
import { RouterLink } from '@angular/router';
import { IonRouterLinkWithHref } from '@ionic/angular/standalone';
@Component({
  selector: 'app-shared-list',
  templateUrl: './shared-list.component.html',
  styleUrls: ['./shared-list.component.scss'],
  imports: [RouterLink, IonRouterLinkWithHref],
})
export class SharedListComponent implements OnInit {
  sharedList = input.required<SharedListInfo>();

  constructor() {}

  ngOnInit() {}
}
