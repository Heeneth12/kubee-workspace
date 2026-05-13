import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { PermissionsService } from './permissions.service';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './permissions.component.html',
})
export class PermissionsComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  isLoading = false;

  constructor(private service: PermissionsService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
