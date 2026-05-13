import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [],
  templateUrl: './forbidden.component.html',
})
export class ForbiddenComponent {
  constructor(private router: Router) {}
  goToLogin() { this.router.navigate(['/auth/login']); }
}
