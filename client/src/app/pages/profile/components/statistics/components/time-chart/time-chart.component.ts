import { Component, computed, input, OnInit } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-time-chart',
  templateUrl: './time-chart.component.html',
  styleUrls: ['./time-chart.component.scss'],
  imports: [BaseChartDirective, IonSpinner],
})
export class TimeChartComponent implements OnInit {
  dailyHistory = input<{
    currentWeek: number[];
    previousWeek: number[];
  } | null>(null);

  constructor() {}

  ngOnInit() {}
  public chartData = computed<ChartConfiguration['data']>(() => {
    const history = this.dailyHistory();

    const currentData = history?.currentWeek ?? [0, 0, 0, 0, 0, 0, 0];
    const previousData = history?.previousWeek ?? [0, 0, 0, 0, 0, 0, 0];

    return {
      labels: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      datasets: [
        {
          data: currentData,
          label: 'This Week',
          backgroundColor: 'rgba(229,54,55,0.2)',
          borderColor: 'rgba(229,54,55,1)',

          fill: true,
        },
        {
          data: previousData,
          label: 'Previous Week',
          backgroundColor: 'rgba(172, 172, 172, 0.1)',
          borderColor: 'rgb(140, 140, 140)',
          borderDash: [5, 5],

          fill: true,
        },
      ],
    };
  });

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 60,
        title: { display: true, text: 'Minutes' },
        ticks: {
          precision: 0,
          stepSize: 20,
        },
      },
    },
  };
}
