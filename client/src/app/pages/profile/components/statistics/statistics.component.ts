import { Component, inject, OnInit, signal } from '@angular/core';
import { IonRow, IonCol } from '@ionic/angular/standalone';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';

import { GenresChartComponent } from './components/genres-chart/genres-chart.component';
import { TimeChartComponent } from './components/time-chart/time-chart.component';
import { TotalTimeComponent } from './components/total-time/total-time.component';
import { APIService } from 'src/app/services/apiservice';
import { GenreStat, TotalWatchTime, UserStatistics } from 'src/app/models/User';

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
  private apiService = inject(APIService);

  totalWatchTime = signal<TotalWatchTime | null>(null);
  dailyHistory = signal<{
    currentWeek: number[];
    previousWeek: number[];
  } | null>(null);

  genres = signal<GenreStat[] | null>(null);

  constructor() {
    this.apiService.get<UserStatistics>('my-stats').subscribe((data) => {
      console.log(data);
      this.totalWatchTime.set(data.totalWatchTime);
      this.dailyHistory.set(data.dailyHistory);
      this.genres.set(data.genres);
    });
  }

  ngOnInit() {}
}
