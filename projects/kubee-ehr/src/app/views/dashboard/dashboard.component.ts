import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './dashboard.service';
import { LucideAngularModule, Users, UserCheck, Banknote, Calendar, Activity, Clock, Plus } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  
  // Icons
  readonly UsersIcon = Users;
  readonly UserCheckIcon = UserCheck;
  readonly BanknoteIcon = Banknote;
  readonly CalendarIcon = Calendar;
  readonly ActivityIcon = Activity;
  readonly ClockIcon = Clock;
  readonly PlusIcon = Plus;

  // Mock Data
  stats = {
    checkedIn: 42,
    todayRegistrations: 15,
    pendingBills: 8,
    revenueToday: 2450
  };

  upcomingAppointments = [
    { id: 1, patient: 'John Doe', time: '10:00 AM', status: 'Waiting' },
    { id: 2, patient: 'Jane Smith', time: '10:30 AM', status: 'Confirmed' },
    { id: 3, patient: 'Robert Johnson', time: '11:15 AM', status: 'In Progress' },
    { id: 4, patient: 'Emily Davis', time: '01:00 PM', status: 'Confirmed' }
  ];

  recentBills = [
    { id: 'INV-001', patient: 'Michael Brown', amount: 150, status: 'Paid' },
    { id: 'INV-002', patient: 'Sarah Wilson', amount: 320, status: 'Pending' },
    { id: 'INV-003', patient: 'James Taylor', amount: 85, status: 'Paid' },
    { id: 'INV-004', patient: 'Linda Anderson', amount: 450, status: 'Pending' }
  ];

  isLoading = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    // Using mock data for now.
    // this.isLoading = true;
    // this.dashboardService.getStats(
    //   (res: any) => { this.stats = res.data; this.isLoading = false; },
    //   () => { this.isLoading = false; }
    // );
  }
}
