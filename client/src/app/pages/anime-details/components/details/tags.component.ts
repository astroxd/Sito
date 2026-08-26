import { Component, computed, inject } from '@angular/core';
import { AnimeDetails } from 'src/app/services/anime-details';
import { IonSkeletonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tags',
  template: `<div class="anime-details-tags">
    <div class="section-header">
      <div class="section-title">
        <h5>Tags</h5>
      </div>
    </div>
    <div class="tags">
      @if (isLoading()) {
        @for (item of [].constructor(10); track $index) {
          <ion-skeleton-text
            animated="true"
            style="width: 36px; border-radius: 4px;"
          ></ion-skeleton-text>
        }
      } @else {
        @for (tag of tags(); track tag.id) {
          <span [id]="tag.id" class="tag no-hover">
            {{ tag.name }}
          </span>
        }
      }
    </div>
  </div>`,
  imports: [IonSkeletonText],
})
export class Tags {
  private AnimeDetailsService = inject(AnimeDetails);

  public isLoading = this.AnimeDetailsService.isLoading;
  public tags = computed(
    () => this.AnimeDetailsService.animeDetails()?.tags ?? [],
  );

  constructor() {}
}
