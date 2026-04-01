import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { form, FormField } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faUserCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive, FormField],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private router = inject(Router);
  faSearch = faSearch;
  faUserCircle = faUserCircle;

  searchModel = signal('');
  searchForm = form(this.searchModel);

  search(e: Event) {
    e.preventDefault();

    const query = this.searchForm().value();
    if (query.length <= 0) return;
    this.searchForm().value.set('');

    this.router.navigate(['/search'], {
      queryParams: { query: query },
    });
  }
}
