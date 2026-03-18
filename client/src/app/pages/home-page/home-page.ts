import { Component } from '@angular/core';
import { SideSection } from '../../components/side-section/side-section';
import { TrendingNow } from './components/trending-now/trending-now';
import { PopularThisSeason } from './components/popular-this-season/popular-this-season';
import { NextSeason } from './components/next-season/next-season';
import { AllTimePopular } from './components/all-time-popular/all-time-popular';

@Component({
  selector: 'app-home-page',
  imports: [TrendingNow, PopularThisSeason, NextSeason, AllTimePopular],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {}
