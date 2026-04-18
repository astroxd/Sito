import { inject, Injectable, signal } from '@angular/core';
import { User } from '../models/User';
import { finalize, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  user = signal<User | undefined | null>(undefined);

  constructor() {
    console.log('Loading user');
    // this.loadUser().subscribe((val) => {
    //   this.user.set(val);
    // });
    this.loadUser();
  }

  private loadUser() {
    this.http
      .get<any>('http://localhost:3001/user/1')
      .pipe(tap((data) => console.log(data)))
      .subscribe(({ user: { user_id: id, username, email } }) => {
        this.user.set({ id, username, email });
      });

    // const observable = new Observable<User>((sub) => {
    //   setTimeout(() => {
    //     sub.next({
    //       username: 'a_str0',
    //       email: 'a@a.com',
    //       title: 'Sensei',
    //     });
    //     sub.complete();
    //   }, 2000);
    // });

    // return observable;
  }

  // public getLists() {
  //   const observable = new Observable<User>((sub) => {
  //     setTimeout(() => {
  //       sub.next(
  //         (this.user = {
  //           username: 'a_str0',
  //           email: 'a@a.com',
  //           title: 'Sensei',
  //         }),
  //       );
  //       sub.complete();
  //     }, 2000);
  //   });

  //   return observable;
  // }
}
