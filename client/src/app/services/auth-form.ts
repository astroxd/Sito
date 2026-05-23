import { inject, Injectable, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from './auth-service';
import { ActivatedRoute, Router } from '@angular/router';
import { confirmPasswordValidator } from './confirm-password-validator';

type ErrorType =
  | 'email'
  | 'required'
  | 'minlength'
  | 'maxlength'
  | 'pattern'
  | 'passwordNoMatch';

@Injectable({
  providedIn: 'root',
})
export class AuthForm {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  private _loginFormControl: LoginForm;
  private _registerFormControl: RegisterForm;

  constructor() {
    this._loginFormControl = new LoginForm(
      this.formBuilder,
      this.authService,
      this.router,
      this.activatedRoute,
    );
    this._registerFormControl = new RegisterForm(
      this.formBuilder,
      this.authService,
      this.router,
      this.activatedRoute,
    );
  }

  public get loginFormControl() {
    return this._loginFormControl;
  }
  public get registerFormControl() {
    return this._registerFormControl;
  }
}

class LoginForm {
  private formBuilder: FormBuilder;
  private authService: AuthService;
  private router: Router;
  private activatedRoute: ActivatedRoute;
  private _loginForm;

  private _formErrors = signal({
    email: '',
    password: '',
  });

  private _loginError = signal('');

  constructor(
    formBuilder: FormBuilder,
    authService: AuthService,
    router: Router,
    activtedRoute: ActivatedRoute,
  ) {
    this.formBuilder = formBuilder;
    this.authService = authService;
    this.router = router;
    this.activatedRoute = activtedRoute;

    this._loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(50),
        ],
      ],
    });

    this._loginForm.valueChanges.subscribe(() => {
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
          this._formErrors.update((errors) => ({
            ...errors,
            [formField]:
              this.formErrorsDict[formField][firstErrorKey] ||
              'Errore Generico',
          }));
        }
      } else {
        // Se non ci sono errori sul field, svuotiamo il messaggio
        this._formErrors.update((errors) => ({
          ...errors,
          [formField]: '',
        }));
      }
    }
  }

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

  login() {
    if (!this._loginForm.valid) {
      this._loginError.set('Il form è invalido');
      this.handleFormErrors();
      return;
    }
    this._loginError.set('');
    const { email, password } = this._loginForm.value;
    this.authService.login(email!, password!).subscribe({
      next: (value: any) => {
        console.log(value);
        const returnUrl =
          this.activatedRoute.snapshot.queryParamMap.get('returnUrl') ||
          '/home';
        this.router.navigateByUrl(returnUrl);
      },
      error: ({ error }) => {
        this._loginError.set(error.message);
      },
    });
  }

  resetForm() {
    this._loginForm.reset();

    this._formErrors.set({ email: '', password: '' });
    this._loginError.set('');
  }

  public get loginForm() {
    return this._loginForm;
  }

  public get formErrors() {
    return this._formErrors;
  }

  public get loginError() {
    return this._loginError;
  }
}
class RegisterForm {
  private formBuilder: FormBuilder;
  private authService: AuthService;
  private router: Router;
  private activatedRoute: ActivatedRoute;
  private _registerForm;

  private _formErrors = signal({
    email: '',
    username: '',
    password: '',
  });

  private _registerError = signal('');

  constructor(
    formBuilder: FormBuilder,
    authService: AuthService,
    router: Router,
    activatedRoute: ActivatedRoute,
  ) {
    this.formBuilder = formBuilder;
    this.authService = authService;
    this.router = router;
    this.activatedRoute = activatedRoute;

    this._registerForm = this.formBuilder.group(
      {
        email: [
          'andreasciortino202222204@gmail.com',
          [Validators.required, Validators.email],
        ],
        username: [
          'proviamo',
          [Validators.required, Validators.pattern('^[a-zA-Z0-9_.]+$')],
        ],
        password: [
          'password123',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(50),
          ],
        ],
        confirmPassword: [
          'password123',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(50),
          ],
        ],
        avatar: [null as File | null],
      },

      { validators: confirmPasswordValidator },
    );

    this._registerForm.valueChanges.subscribe(() => {
      this.handleFormErrors();
    });
  }
  handleFormErrors() {
    const formFields = Object.keys(this.formErrorsDict) as Array<
      'email' | 'username' | 'password'
    >;

    for (const formField of formFields) {
      const field = this.registerForm.get(formField);

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

  private formErrorsDict: Record<
    'email' | 'username' | 'password',
    Partial<Record<ErrorType, string>>
  > = {
    email: {
      required: "L'email è obbligatoria.",
      email: 'Inserisci un indirizzo email valido.',
    },
    username: {
      required: "L'username è obbligatorio",
      pattern: 'Pattern?',
    },
    password: {
      required: 'La password è obbligatoria.',
      minlength: 'La password deve contenere almeno 8 caratteri.',
      maxlength: 'La password non può superare i 50 caratteri.',
    },
  };

  register() {
    if (!this._registerForm.valid) {
      this._registerError.set('Il form è invalido');
      this.handleFormErrors();
      return;
    }

    this._registerError.set('');
    const { email, username, password, avatar } = this._registerForm.value;

    this.authService.register(email!, username!, password!, avatar!).subscribe({
      next: (value: any) => {
        console.log(value);
        const returnUrl =
          this.activatedRoute.snapshot.queryParamMap.get('returnUrl') ||
          '/home';
        this.router.navigateByUrl(returnUrl);
      },
      error: ({ error }) => {
        console.log(error.message);
        this._registerError.set(error.message);
      },
    });
  }

  resetForm() {
    this._registerForm.reset();

    this._formErrors.set({ email: '', username: '', password: '' });
    this._registerError.set('');
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      this._registerForm.patchValue({
        avatar: file,
      });
    }
  }

  public get registerForm() {
    return this._registerForm;
  }

  public get formErrors() {
    return this._formErrors;
  }

  public get registerError() {
    return this._registerError;
  }

  public get confirmPassword() {
    return this._registerForm.get('confirmPassword');
  }
}
