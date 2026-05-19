import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

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
import { Router } from 'node_modules/@angular/router';

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
  ],
})
export class LoginPage implements OnInit {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  public loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(50)],
    ],
  });

  // private FormFields = Object.keys(this.loginForm.controls);

  private formErrorsDict: Record<
    'email' | 'password',
    Partial<Record<ErrorType, string>>
  > = {
    email: {
      required: "L'email è obbligatoria.",
      email: 'Inserisci un indirizzo email valido.',
    },
    password: {
      required: 'La password è obbligatoria.',
      minlength: 'La password deve contenere almeno 6 caratteri.',
      maxlength: 'La password non può superare i 50 caratteri.',
    },
  };

  public formErrors = signal({
    email: '',
    password: '',
  });

  constructor() {
    this.loginForm.valueChanges.subscribe(() => {
      this.handleFormErrors();
    });
  }

  handleFormErrors() {
    const formFields = Object.keys(this.formErrorsDict) as Array<
      'email' | 'password'
    >;

    for (const formField of formFields) {
      const field = this.loginForm.get(formField);

      // Controlliamo se il field esiste ed ha errori
      if (field && field.errors) {
        // Prendiamo la prima chiave d'errore attiva (es. 'required', 'minlength')
        const firstErrorKey = Object.keys(field.errors)[0] as ErrorType;

        // Assegniamo il testo associato a quell'errore specifico
        // solo se il field è stato toccato
        if (field.invalid && (field.dirty || field.touched)) {
          this.formErrors.update((errors) => ({
            ...errors,
            [formField]:
              this.formErrorsDict[formField][firstErrorKey] ||
              'Errore Generico',
          }));
        }
      } else {
        // Se non ci sono errori sul field, svuotiamo il messaggio
        this.formErrors.update((errors) => ({
          ...errors,
          [formField]: '',
        }));
      }
    }
  }

  ngOnInit() {}

  onSubmit() {
    if (!this.loginForm.valid) {
      console.log('Il Form è invalido');
      this.handleFormErrors();
      return;
    }

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!);
    // .subscribe((res: any) => {
    //   this.authService.setUser(res.user);
    //   console.log(res);
    //   this.authService.setToken(res.accessToken);

    //   if (res.user) {
    //     this.router.navigate(['profile']);
    //   }
    // });
  }

  TestAuth() {
    this.http.get('http://localhost:3001/testauth').subscribe((res) => {
      console.log(res);
    });
  }
}
