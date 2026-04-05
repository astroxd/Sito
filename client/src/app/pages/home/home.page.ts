import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';

import { TrendingNow } from './components/trending-now/trending-now';
import { PopularThisSeason } from './components/popular-this-season/popular-this-season';
import { NextSeason } from './components/next-season/next-season';
import { AllTimePopular } from './components/all-time-popular/all-time-popular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    TrendingNow,
    PopularThisSeason,
    NextSeason,
    AllTimePopular,
    IonGrid,
    IonRow,
    IonCol,
  ],
})
export class HomePage implements OnInit {
  constructor() {}

  ngOnInit() {}
}
