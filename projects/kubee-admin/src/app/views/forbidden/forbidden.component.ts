import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forbidden.component.html',
})
export class ForbiddenComponent {
  constructor(private router: Router) {}
  goToLogin() { this.router.navigate(['/auth/login']); }
}
