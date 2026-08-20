import { Component, computed, inject } from '@angular/core';
import { AnimeDetails } from 'src/app/services/anime-details';

@Component({
  selector: 'app-tags',
  template: `<div class="anime-details-tags">
    <div class="section-header">
      <div class="section-title">
        <h5>Tags</h5>
      </div>
    </div>
    <div class="tags">
      @for (tag of tags(); track tag.id) {
        <span [id]="tag.id" class="tag no-hover">
          {{ tag.name }}
        </span>
      }
    </div>
  </div>`,
  imports: [],
})
export class Tags {
  private AnimeDetailsService = inject(AnimeDetails);

  public tags = computed(
    () => this.AnimeDetailsService.animeDetails()?.tags ?? [],
  );

  constructor() {}
}
