import { Component, EnvironmentInjector, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, search, person, eye } from 'ionicons/icons';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    FontAwesomeModule,
  ],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  faHeart = faHeart;

  constructor() {
    addIcons({ home, search, person, eye });
  }
}
