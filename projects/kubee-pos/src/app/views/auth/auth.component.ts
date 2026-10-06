import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';
import { AuthService } from '../../layouts/guards/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  authForm: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage = '';

  readonly icons = { eye: Eye, eyeOff: EyeOff };

  constructor(private fb: FormBuilder, private authSvc: AuthService, private toastService: ToastService) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit() {
    if (this.authForm.invalid) { this.authForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMessage = '';
    this.authSvc.login(this.authForm.value,
      () => { this.isLoading = false; this.toastService.show('Login Successful!', 'success'); },
      (error: any) => {
        this.errorMessage = error?.error?.message || 'An unexpected error occurred';
        this.toastService.show(this.errorMessage, 'error');
        this.isLoading = false;
      }
    );
  }

  hasError(control: string): boolean {
    const c = this.authForm.get(control);
    return !!c && c.invalid && c.touched;
  }
}
