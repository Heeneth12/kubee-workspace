import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { AuditLogsService } from './audit-logs.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './audit-logs.component.html',
})
export class AuditLogsComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  isLoading = false;

  constructor(private service: AuditLogsService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
