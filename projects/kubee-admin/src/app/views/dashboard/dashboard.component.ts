import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  stats: any = null;
  isLoading = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.isLoading = true;
    this.dashboardService.getStats(
      (res: any) => { this.stats = res.data; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
