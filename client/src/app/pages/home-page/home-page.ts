import { Component } from '@angular/core';
import { Section } from '../../components/section/section';
import { SideSection } from '../../components/side-section/side-section';

@Component({
  selector: 'app-home-page',
  imports: [Section, SideSection],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {}
