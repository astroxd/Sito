import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
// import { form, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private router = inject(Router);

  searchModel = signal('');
  // searchForm = form(this.searchModel);

  search(e: Event) {
    e.preventDefault();

    // const query = this.searchForm().value();
    // if (query.length <= 0) return;
    // this.searchForm().value.set('');

    // this.router.navigate(['/search'], {
    //   queryParams: { query: query, sort: 'POPULARITY_DESC', page: 1 },
    // });
  }
}
