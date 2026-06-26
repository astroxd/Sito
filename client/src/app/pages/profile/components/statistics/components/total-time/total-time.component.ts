import { Component, input, OnInit } from '@angular/core';
import { TotalWatchTime } from 'src/app/models/User';

@Component({
  selector: 'app-total-time',
  templateUrl: './total-time.component.html',
  styleUrls: ['./total-time.component.scss'],
})
export class TotalTimeComponent implements OnInit {
  totalTime = input<TotalWatchTime | null>(null);

  constructor() {}

  ngOnInit() {}
}
