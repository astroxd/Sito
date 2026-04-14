import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.scss'],
  imports: [RouterLink],
})
export class ListsComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
