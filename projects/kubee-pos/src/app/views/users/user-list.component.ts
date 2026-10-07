import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, Search, ChevronLeft, ChevronRight, Plus, Pencil, Users } from 'lucide-angular';
import { UsersService } from './users.service';
import { UserSummary } from './users.models';
import { readApiError } from '../catalog/catalog-errors';
import { AuthService } from '../../layouts/guards/auth.service';
import { PosPrivileges } from '../../layouts/guards/pos-permissions';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  private usersService = inject(UsersService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly icons = { search: Search, prev: ChevronLeft, next: ChevronRight, plus: Plus, edit: Pencil, empty: Users };
  readonly canEdit = this.authService.hasPermission(PosPrivileges.USER_MGMT_EDIT);
  readonly pageSize = 50;

  users: UserSummary[] = [];
  isLoading = false;
  busyId: number | null = null;
  search = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;
  search$ = new Subject<string>();

  ngOnInit() {
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.page = 0; this.loadUsers(); });
    this.loadUsers();
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    this.page = page;
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.usersService.searchUsers(this.page, this.pageSize, this.search.trim()).subscribe({
      next: result => {
        this.users = result.content;
        this.totalPages = result.totalPages;
        this.totalElements = result.totalElements;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }

  isSuperAdmin(user: UserSummary): boolean {
    return !!user.roles?.includes('SUPER_ADMIN');
  }

  toggleActive(user: UserSummary) {
    if (!this.canEdit || this.isSuperAdmin(user)) return;
    this.busyId = user.id;
    this.usersService.toggleStatus(user.id).subscribe({
      next: () => {
        user.isActive = !user.isActive;
        this.busyId = null;
        this.toastService.show(`${user.fullName} ${user.isActive ? 'activated' : 'deactivated'}`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.busyId = null;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }
}
