import { Component, input, OnInit } from '@angular/core';
import {
  SharedListInfo,
  SharedListInvitation,
} from 'src/app/models/SharedList';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-shared-list',
  templateUrl: './shared-list.component.html',
  styleUrls: ['./shared-list.component.scss'],
  imports: [RouterLink],
})
export class SharedListComponent implements OnInit {
  sharedList = input.required<SharedListInfo>();

  constructor() {}

  ngOnInit() {}
}
