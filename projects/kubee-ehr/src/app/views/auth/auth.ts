import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../layout/guards/auth.service';
import { ToastService } from 'kubee-ui';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get email() { return this.loginForm.get('email')!; }
  get password() { return this.loginForm.get('password')!; }

  onSubmit() {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.login(
      this.loginForm.value,
      () => { this.isLoading = false; },
      (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Login failed. Please check your credentials.';
        this.toastService.show(this.errorMessage, 'error');
      }
    );
  }
}
