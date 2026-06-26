import { Component, computed, input, OnInit } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { genreOptions } from 'src/app/helpers/animeSearchOptions';
import { GenreStat } from 'src/app/models/User';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-genres-chart',
  templateUrl: './genres-chart.component.html',
  styleUrls: ['./genres-chart.component.scss'],
  imports: [BaseChartDirective, IonSpinner],
})
export class GenresChartComponent implements OnInit {
  genres = input<GenreStat[] | null>(null);
  constructor() {}

  ngOnInit() {}

  public chartData = computed<ChartConfiguration['data']>(() => {
    const currentStats = this.genres() ?? [];

    const statsMap = new Map<string, number>(
      currentStats.map((s) => [s.genre, s.count]),
    );

    const alignedData = genreOptions.map(({ name }) => statsMap.get(name) ?? 0);

    return {
      labels: genreOptions.map(({ name }) => name),
      datasets: [
        {
          data: alignedData,
          label: 'Completed Anime',
          backgroundColor: 'rgba(229, 54, 55, 0.2)',
          borderColor: 'rgba(229, 54, 55, 1)',
          pointBackgroundColor: 'rgba(229, 54, 55, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(229, 54, 55, 1)',
        },
      ],
    };
  });

  public radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          display: false,
          precision: 0,
        },
        pointLabels: {
          color: '#fff',
          font: {
            size: 11,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };
}
