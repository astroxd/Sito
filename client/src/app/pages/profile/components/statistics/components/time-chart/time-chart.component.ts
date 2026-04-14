import { Component, OnInit } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-time-chart',
  templateUrl: './time-chart.component.html',
  styleUrls: ['./time-chart.component.scss'],
  imports: [BaseChartDirective],
})
export class TimeChartComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [65, 59, 80],
        // label: 'Serie A',
        backgroundColor: 'rgba(229,54,55,0.4)',
        borderColor: 'rgba(229,54,55,1)',
        // fill: true,
      },
      {
        data: [30, 20, 80, 81, 56, 55, 500],
        // label: 'Serie A',
        backgroundColor: 'rgba(172, 172, 172, 0.4)',
        borderColor: 'rgb(92, 92, 92)',
        // fill: true,
      },
    ],
    labels: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
  };

  public lineChartType: ChartType = 'line';
}
