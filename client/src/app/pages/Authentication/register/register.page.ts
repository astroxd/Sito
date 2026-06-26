import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonGrid,
  IonCol,
  IonRow,
  IonRouterLinkWithHref,
} from '@ionic/angular/standalone';

import { RouterLink } from '@angular/router';

import { AuthForm } from 'src/app/services/auth-form';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faUser, faLock } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    IonGrid,
    IonCol,
    IonRow,
    ReactiveFormsModule,
    IonRouterLinkWithHref,
    RouterLink,
    FontAwesomeModule,
  ],
})
export class RegisterPage implements OnInit {
  private authForm = inject(AuthForm);
  faEnvelope = faEnvelope;
  faLock = faLock;
  faUser = faUser;

  public registerFormControl = this.authForm.registerFormControl;
  public formErrors = this.registerFormControl.formErrors;
  public registerError = this.registerFormControl.registerError;
  public confirmPassword = this.registerFormControl.confirmPassword;

  constructor() {}

  ngOnInit() {
    this.registerFormControl.resetForm();
  }

  onSubmit() {
    this.registerFormControl.register();
  }
}
