import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
      <!-- prettier-ignore -->
      @for (tag of (tags$ | async); track $index) {
        <span [id]="$index" class="tag no-hover">
          {{ tag.name }}
        </span>
      }
    </div>
  </div>`,
  imports: [AsyncPipe],
})
export class Tags implements OnInit {
  private route = inject(ActivatedRoute);
  private AnimeDetailsService = inject(AnimeDetails);

  tags$: any;

  constructor() {
    const animeId = this.route.snapshot.paramMap.get('id');
    if (animeId) {
      this.tags$ = this.AnimeDetailsService.GetAnimeTags(animeId);
    }
  }

  ngOnInit() {}
}
