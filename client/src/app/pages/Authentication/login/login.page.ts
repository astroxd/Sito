import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';

import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthForm } from 'src/app/services/auth-form';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    IonGrid,
    IonRow,
    IonCol,
    ReactiveFormsModule,

    RouterLink,
  ],
})
export class LoginPage implements OnInit {
  private http = inject(HttpClient);
  private authForm = inject(AuthForm);

  public loginFormControl = this.authForm.loginFormControl;
  public formErrors = this.loginFormControl.formErrors;
  public loginError = this.loginFormControl.loginError;

  constructor() {}

  ngOnInit() {
    this.loginFormControl.resetForm();
  }

  onSubmit() {
    this.loginFormControl.login();
  }
}
