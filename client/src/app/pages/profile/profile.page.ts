import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
} from '@ionic/angular/standalone';
import { RouterOutlet } from '@angular/router';
import { AuthService } from 'src/app/services/auth-service';
import { User } from 'src/app/models/User';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonGrid,
    RouterOutlet,
  ],
})
export class ProfilePage implements OnInit {
  UserService = inject(AuthService);

  user?: User;

  constructor() {
    // this.user = this.UserService.getUser();
  }

  ngOnInit() {}
}
