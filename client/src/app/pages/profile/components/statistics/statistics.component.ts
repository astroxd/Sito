import { Component, OnInit } from '@angular/core';
import { IonRow, IonCol } from '@ionic/angular/standalone';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';

import { GenresChartComponent } from './components/genres-chart/genres-chart.component';
import { TimeChartComponent } from './components/time-chart/time-chart.component';
import { TotalTimeComponent } from './components/total-time/total-time.component';

@Component({
  selector: 'app-profile-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
  imports: [
    IonRow,
    IonCol,
    ProfileInfoComponent,
    GenresChartComponent,
    TimeChartComponent,
    TotalTimeComponent,
  ],
})
export class StatisticsComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
