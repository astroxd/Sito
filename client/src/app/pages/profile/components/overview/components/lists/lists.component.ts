import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimeStatus } from 'src/app/models/List';
import { IonProgressBar } from '@ionic/angular/standalone';
import { ListsService } from 'src/app/services/lists-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-profile-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.scss'],
  imports: [RouterLink, IonProgressBar, FontAwesomeModule],
})
export class ListsComponent implements OnInit {
  private listsService = inject(ListsService);
  public readonly AnimeStatus = AnimeStatus;
  faLongArrowAltRight = faLongArrowAltRight;

  status = signal<AnimeStatus>(AnimeStatus.Watching);

  listedAnimes = computed(() =>
    this.listsService.getSignalByStatus(this.status())(),
  );

  constructor() {}

  ngOnInit() {}
}
