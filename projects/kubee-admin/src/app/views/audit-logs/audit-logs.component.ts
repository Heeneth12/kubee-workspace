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
  userRequests: UserRequestModel[] = [];
  isLoading = false;
  page?: number = 0;
  size?: number = 10;

  constructor(private service: AuditLogsService) { }

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getUserRequests(
      this.page,
      this.size,
      (res: any) => {
        console.log(res);
        this.userRequests = res.data.content ?? [];
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );
  }
}

export class UserRequestModel {
  userReqUuid!: string;
  userUuid!: string;
  assignedUuid!: string;
  contactEmail!: string;
  contactName!: string;
  subject!: string;
  description!: string;
  sourceUrl!: string;
  sourceName!: string;
  category!: string;
  status!: string;
  priority!: string;
  metadata!: Map<string, Object>;
  createdAt!: string;
  resolvedAt!: string;
}