import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { UsersService } from './users.service';
import { ToastService } from 'kubee-ui';
import { UserModel } from '../../layout/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  page = 0;
  size = 10;
  searchControl = new FormControl('');
  users: UserModel[] = [];
  totalItems = 0;
  isLoading = false;

  constructor(private service: UsersService, private toast: ToastService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAllUsers(
      this.page,
      this.size,
      {},
      (res: any) => {
        this.users = res.data.content.map((user: any) => user as UserModel) ?? [];
        this.totalItems = res.data.totalElements ?? 0;
        this.page = res.data.page ?? 0;
        this.size = res.data.size ?? 10;
        this.isLoading = false;
      },
      (err: any) => { 
        this.isLoading = false; 
        this.toast.show('Failed to load users', 'error'); 
      }
    );
  }
}
