import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RolesService } from './roles.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.component.html',
})
export class RolesComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  isLoading = false;

  constructor(private service: RolesService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
