import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { IonContent, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { AuthForm } from 'src/app/services/auth-form';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    IonGrid,
    IonRow,
    IonCol,
    ReactiveFormsModule,
    FontAwesomeModule,
    RouterLink,
  ],
})
export class LoginPage implements OnInit {
  private authForm = inject(AuthForm);
  faEnvelope = faEnvelope;
  faLock = faLock;

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
