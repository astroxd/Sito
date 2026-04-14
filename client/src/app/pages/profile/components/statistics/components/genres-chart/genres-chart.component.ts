import { Component, OnInit } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { genreOptions } from 'src/app/pages/search/searchOptions';

@Component({
  selector: 'app-genres-chart',
  templateUrl: './genres-chart.component.html',
  styleUrls: ['./genres-chart.component.scss'],
  imports: [BaseChartDirective],
})
export class GenresChartComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [65, 59, 80, 81, 56, 55, 40],
        // label: 'Serie A',
        backgroundColor: 'rgba(229,54,55,0.4)',
        borderColor: 'rgba(229,54,55,1)',
      },
    ],
    labels: genreOptions.map(({ name }) => name),
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,

    scales: {
      r: {
        ticks: {
          display: false,
        },
        pointLabels: {
          color: 'rgb(255,255,255)',
        },
      },
    },
  };

  public lineChartType: ChartType = 'radar';
}
