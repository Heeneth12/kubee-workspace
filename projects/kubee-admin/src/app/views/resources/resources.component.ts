import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ResourcesService } from './resources.service';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resources.component.html',
})
export class ResourcesComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  isLoading = false;

  constructor(private service: ResourcesService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
