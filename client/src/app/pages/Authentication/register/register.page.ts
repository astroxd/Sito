import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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

import { Router, RouterLink } from '@angular/router';
import { confirmPasswordValidator } from 'src/app/services/confirm-password-validator';
import { AuthService } from 'src/app/services/auth-service';
import { AuthForm } from 'src/app/services/auth-form';

type ErrorType =
  | 'email'
  | 'required'
  | 'minlength'
  | 'maxlength'
  | 'pattern'
  | 'passwordNoMatch';

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
    JsonPipe,
  ],
})
export class RegisterPage implements OnInit {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private authForm = inject(AuthForm);

  public registerFormControl = this.authForm.registerFormControl;
  public formErrors = this.registerFormControl.formErrors;
  public registerError = this.registerFormControl.registerError;
  public confirmPassword = this.registerFormControl.confirmPassword;

  // public registerForm = this.formBuilder.group(
  //   {
  //     email: [
  //       'andreasciortino2004@gmail.com',
  //       [Validators.required, Validators.email],
  //     ],
  //     username: [
  //       'andrea',
  //       [Validators.required, Validators.pattern('^[a-zA-Z0-9_.]+$')],
  //     ],
  //     password: [
  //       'password123',
  //       [
  //         Validators.required,
  //         Validators.minLength(8),
  //         Validators.maxLength(50),
  //       ],
  //     ],
  //     confirmPassword: [
  //       'password123',
  //       [
  //         Validators.required,
  //         Validators.minLength(8),
  //         Validators.maxLength(50),
  //       ],
  //     ],
  //   },

  //   { validators: confirmPasswordValidator },
  // );

  // private formErrorsDict: Record<
  //   'email' | 'username' | 'password',
  //   Partial<Record<ErrorType, string>>
  // > = {
  //   email: {
  //     required: "L'email è obbligatoria.",
  //     email: 'Inserisci un indirizzo email valido.',
  //   },
  //   username: {
  //     required: "L'username è obbliogatorio",
  //     pattern: 'Pattern?',
  //   },
  //   password: {
  //     required: 'La password è obbligatoria.',
  //     minlength: 'La password deve contenere almeno 8 caratteri.',
  //     maxlength: 'La password non può superare i 50 caratteri.',
  //   },
  // };

  // public formErrors = signal({
  //   email: '',
  //   username: '',
  //   password: '',
  // });

  // public registrationError = signal('');

  constructor() {
    // this.registerForm.valueChanges.subscribe(() => {
    //   this.handleFormErrors();
    // });
  }

  // handleFormErrors() {
  //   const formFields = Object.keys(this.formErrorsDict) as Array<
  //     'email' | 'username' | 'password'
  //   >;

  //   for (const formField of formFields) {
  //     const field = this.registerForm.get(formField);

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
    this.registerFormControl.register();
    //   if (!this.registerForm.valid) {
    //     this.registrationError.set('Il form è invalido');
    //     this.handleFormErrors();
    //     return;
    //   }
    //   this.registrationError.set('');
    //   const { email, username, password } = this.registerForm.value;
    //   this.authService.register(email!, username!, password!).subscribe({
    //     next: (value: any) => {
    //       console.log(value);
    //       this.router.navigate(['/profile']);
    //     },
    //     error: (err) => {
    //       this.registrationError.set(err.error);
    //     },
    //   });
  }
}
