import { Component, inject, input, OnInit, output } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';
import { AnimeEpisode } from 'src/app/models/AnimeDetails';

@Component({
  selector: 'app-side-episode-card',
  templateUrl: './side-episode-card.component.html',
  styleUrls: [
    '../../../../../../components/side-anime-card/side-anime-card.scss',
    './side-episode-card.component.scss',
  ],
})
export class SideEpisodeCardComponent implements OnInit {
  episode = input.required<AnimeEpisode>();
  lastEpisodeWatched = input<number | null>(null);
  private alertController = inject(AlertController);

  updateEpisodes = output<number>();

  constructor() {}

  ngOnInit() {}

  async confirmBulkEpisodes(episodeTarget: number) {
    const alert = await this.alertController.create({
      header: 'Confirm',

      message: `Are you sure you want to mark up to episode <strong>${episodeTarget}</strong>? Your previous progress will be overwritten.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',

          handler: () => {
            console.log('canceled');
          },
        },
        {
          text: 'Yes, update',
          role: 'confirm',

          handler: () => {
            this.updateEpisodes.emit(episodeTarget);
          },
        },
      ],
    });

    await alert.present();
  }
}
