import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonCol,
  IonRow,
  IonRouterLinkWithHref,
} from '@ionic/angular/standalone';

import { RouterLink } from '@angular/router';

import { AuthForm } from 'src/app/services/auth-form';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonGrid,
    IonCol,
    IonRow,
    ReactiveFormsModule,
    IonRouterLinkWithHref,
    RouterLink,
  ],
})
export class RegisterPage implements OnInit {
  private authForm = inject(AuthForm);

  public registerFormControl = this.authForm.registerFormControl;
  public formErrors = this.registerFormControl.formErrors;
  public registerError = this.registerFormControl.registerError;
  public confirmPassword = this.registerFormControl.confirmPassword;

  constructor() {}

  ngOnInit() {
    // this.registerFormControl.resetForm();
  }

  onSubmit() {
    this.registerFormControl.register();
  }
}
