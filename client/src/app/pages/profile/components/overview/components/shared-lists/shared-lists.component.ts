import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile-shared-lists',
  templateUrl: './shared-lists.component.html',
  styleUrls: ['./shared-lists.component.scss'],
  imports: [RouterLink],
})
export class SharedListsComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
