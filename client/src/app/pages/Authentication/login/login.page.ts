import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth-service';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthForm } from 'src/app/services/auth-form';

type ErrorType = 'email' | 'required' | 'minlength' | 'maxlength';

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
    JsonPipe,
    RouterLink,
  ],
})
export class LoginPage implements OnInit {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private authForm = inject(AuthForm);

  public loginFormControl = this.authForm.loginFormControl;
  public formErrors = this.loginFormControl.formErrors;
  public loginError = this.loginFormControl.loginError;

  // public loginForm = this.formBuilder.group({
  //   email: ['', [Validators.required, Validators.email]],
  //   password: [
  //     '',
  //     [Validators.required, Validators.minLength(8), Validators.maxLength(50)],
  //   ],
  // });

  // private formErrorsDict: Record<
  //   'email' | 'password',
  //   Partial<Record<ErrorType, string>>
  // > = {
  //   email: {
  //     required: "L'email è obbligatoria.",
  //     email: 'Inserisci un indirizzo email valido.',
  //   },
  //   password: {
  //     required: 'La password è obbligatoria.',
  //     minlength: 'La password deve contenere almeno 6 caratteri.',
  //     maxlength: 'La password non può superare i 50 caratteri.',
  //   },
  // };

  // public formErrors = signal({
  //   email: '',
  //   password: '',
  // });

  // public loginError = signal('');

  constructor() {
    // this.loginForm.valueChanges.subscribe(() => {
    //   this.handleFormErrors();
    // });
  }

  // handleFormErrors() {
  //   const formFields = Object.keys(this.formErrorsDict) as Array<
  //     'email' | 'password'
  //   >;

  //   for (const formField of formFields) {
  //     const field = this.loginForm.get(formField);

  //     // Controlliamo se il field esiste ed ha errori
  //     if (field && field.errors) {
  //       // Prendiamo la prima chiave d'errore attiva (es. 'required', 'minlength')
  //       const firstErrorKey = Object.keys(field.errors)[0] as ErrorType;

  //       // Assegniamo il testo associato a quell'errore specifico
  //       // solo se il field è stato toccato
  //       if (field.invalid && (field.dirty || field.touched)) {
  //         this.formErrors.update((errors) => ({
  //           ...errors,
  //           [formField]:
  //             this.formErrorsDict[formField][firstErrorKey] ||
  //             'Errore Generico',
  //         }));
  //       }
  //     } else {
  //       // Se non ci sono errori sul field, svuotiamo il messaggio
  //       this.formErrors.update((errors) => ({
  //         ...errors,
  //         [formField]: '',
  //       }));
  //     }
  //   }
  // }

  ngOnInit() {}

  onSubmit() {
    this.loginFormControl.login();
    // if (!this.loginForm.valid) {
    //   this.loginError.set('Il form è invalido');
    //   this.handleFormErrors();
    //   return;
    // }
    // this.loginError.set('');
    // const { email, password } = this.loginForm.value;
    // this.authService.login(email!, password!).subscribe({
    //   next: (value: any) => {
    //     console.log(value);
    //     this.router.navigate(['/profile']);
    //   },
    //   error: (err) => {
    //     this.loginError.set(err.error);
    //   },
    // });
  }

  TestAuth() {
    this.http.get('http://localhost:3001/testauth').subscribe((res) => {
      console.log(res);
    });
  }
}
