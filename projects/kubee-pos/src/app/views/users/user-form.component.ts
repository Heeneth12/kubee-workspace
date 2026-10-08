import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, ArrowLeft, Save } from 'lucide-angular';
import { UsersService } from './users.service';
import { AppModule, AppPrivilege, AppSummary, SaveUserRequest, UserDetail } from './users.models';
import { readApiError } from '../catalog/catalog-errors';
import { AuthService } from '../../layouts/guards/auth.service';

/** Create a staff user or change one's KUBEE_POS privileges. Other apps' access is left untouched. */
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly icons = { back: ArrowLeft, save: Save };
  // Super admins may grant anything; other managers only what they hold themselves (ezauth enforces the same)
  private readonly isSuperAdmin = !!this.authService.getCurrentUserValue()?.userRoles?.includes('SUPER_ADMIN');

  userId: number | null = null;
  user: UserDetail | null = null;
  posApp: AppSummary | undefined;
  modules: AppModule[] = [];
  selected = new Set<number>();
  isLoading = true;
  isSaving = false;
  formError: string | null = null;

  form: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: [''],
  });

  get isEdit(): boolean {
    return this.userId !== null;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.userId = id ? Number(id) : null;

    const passwordCtrl = this.form.get('password')!;
    if (this.isEdit) {
      this.form.get('email')!.disable();
      passwordCtrl.setValidators(Validators.minLength(8));
    } else {
      passwordCtrl.setValidators([Validators.required, Validators.minLength(8)]);
    }
    passwordCtrl.updateValueAndValidity();

    this.usersService.getPosApp().pipe(
      switchMap(app => {
        this.posApp = app;
        return forkJoin({
          modules: app ? this.usersService.getModules(app.id) : of([] as AppModule[]),
          user: this.userId ? this.usersService.getUser(this.userId) : of(null),
        });
      })
    ).subscribe({
      next: ({ modules, user }) => {
        this.modules = modules.filter(m => m.isActive !== false && m.privileges?.length);
        if (user) this.patchUser(user);
        if (!this.posApp) this.formError = 'This business does not have Kubee POS enabled.';
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
        this.goBack();
      }
    });
  }

  private patchUser(user: UserDetail) {
    this.user = user;
    this.form.patchValue({ fullName: user.fullName, email: user.email, phone: user.phone ?? '' });
    const posAccess = user.userApplications?.find(ua => ua.applicationId === this.posApp?.id);
    posAccess?.modulePrivileges.forEach(p => this.selected.add(p.privilegeId));
  }

  canGrant(privilege: AppPrivilege): boolean {
    return this.isSuperAdmin || this.authService.hasPermission(privilege.privilegeKey);
  }

  isSelected(privilege: AppPrivilege): boolean {
    return this.selected.has(privilege.id);
  }

  toggle(privilege: AppPrivilege) {
    if (!this.canGrant(privilege)) return;
    this.selected.has(privilege.id) ? this.selected.delete(privilege.id) : this.selected.add(privilege.id);
  }

  isModuleFull(module: AppModule): boolean {
    return (module.privileges ?? []).every(p => this.selected.has(p.id));
  }

  toggleModule(module: AppModule) {
    const grantable = (module.privileges ?? []).filter(p => this.canGrant(p));
    const selectAll = !grantable.every(p => this.selected.has(p.id));
    grantable.forEach(p => selectAll ? this.selected.add(p.id) : this.selected.delete(p.id));
  }

  controlError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.invalid || !(ctrl.touched || ctrl.dirty)) return null;
    if (ctrl.errors?.['required']) return 'Required';
    if (ctrl.errors?.['email']) return 'Enter a valid email';
    if (ctrl.errors?.['minlength']) return 'At least 8 characters';
    return 'Invalid value';
  }

  save() {
    this.formError = null;
    if (this.form.invalid || !this.posApp) {
      this.form.markAllAsTouched();
      return;
    }
    const posAppId = this.posApp.id;
    const value = this.form.getRawValue();

    // applicationIds is a full replace in ezauth: keep the user's other apps and add POS
    const applicationIds = Array.from(new Set([...(this.user?.applicationIds ?? []), posAppId]));

    const body: SaveUserRequest = {
      fullName: value.fullName.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
      userType: this.user?.userType ?? 'EMPLOYEE',
      applicationIds,
      // One entry per module, even when empty, so unticked privileges are removed
      privilegeMapping: this.modules.map(module => ({
        applicationId: posAppId,
        moduleId: module.id,
        privilegeIds: (module.privileges ?? []).filter(p => this.selected.has(p.id)).map(p => p.id),
      })),
    };
    if (value.password) body.password = value.password;

    this.isSaving = true;
    const request$ = this.userId
      ? this.usersService.updateUser(this.userId, body)
      : this.usersService.createUser(body);
    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.show(`${body.fullName} ${this.isEdit ? 'updated' : 'created'}`, 'success');
        this.goBack();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving = false;
        this.formError = readApiError(err).message;
      }
    });
  }

  goBack() {
    this.router.navigate(['/users']);
  }
}
