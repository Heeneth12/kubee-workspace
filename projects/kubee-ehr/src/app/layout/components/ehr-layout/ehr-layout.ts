import { Component, HostListener, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  Calendar,
  Pill,
  CreditCard,
  ChevronDown,
  ChevronLeft,
  Menu,
  Search,
  SettingsIcon,
  X,
  BookOpen,
  HelpCircle,
  MessageSquare,
  LogOut,
  Zap,
  Bug,
} from 'lucide-angular';
import { CustomDropdownComponent, DropdownMenuItem } from 'kubee-ui';
import { Subscription } from 'rxjs';
import { AuthService } from '../../guards/auth.service';
import { BranchSelectorComponent } from "../branch-selector/branch-selector.component";

@Component({
  selector: 'app-ehr-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, CustomDropdownComponent, BranchSelectorComponent],
  templateUrl: './ehr-layout.html',
  styleUrl: './ehr-layout.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EhrLayout implements OnInit, OnDestroy {

  isMobileMenuOpen = false;
  isSidebarCollapsed = false;
  private userSub = new Subscription();

  readonly ChevronDown = ChevronDown;
  readonly ChevronLeft = ChevronLeft;
  readonly Menu = Menu;
  readonly Search = Search;
  readonly XIcon = X;
  readonly helpIcon = HelpCircle;
  readonly Zap = Zap;

  user: UserProfile = { name: '', role: 'EHR_USER', initials: 'EU', email: '' };

  helpCenterItems: DropdownMenuItem[] = [
    {
      label: 'Knowledge Base',
      subLabel: 'Platform documentation',
      icon: BookOpen,
      iconBgClass: 'bg-slate-50',
      colorClass: 'text-slate-600',
      action: () => { }
    },
    {
      label: 'Contact Support',
      subLabel: 'Open a support ticket',
      icon: MessageSquare,
      iconBgClass: 'bg-slate-50',
      colorClass: 'text-slate-600',
      action: () => { }
    },
    {
      label: 'Bug Report',
      subLabel: 'Report a platform issue',
      icon: Bug,
      iconBgClass: 'bg-slate-50',
      colorClass: 'text-slate-600',
      action: () => { }
    }
  ];

  userMenuItems: DropdownMenuItem[] = [
    {
      label: 'Settings',
      subLabel: 'System preferences',
      icon: SettingsIcon,
      iconBgClass: 'bg-slate-50',
      colorClass: 'text-slate-600',
      action: () => { }
    },
    {
      label: 'Sign Out',
      icon: LogOut,
      iconBgClass: 'bg-rose-50',
      colorClass: 'text-rose-600',
      action: () => this.authService.logout()
    }
  ];

  allNavItems: NavItem[] = [
    { label: 'Menu', isHeader: true, icon: null },
    { label: 'Dashboard', link: '/dashboard', icon: LayoutDashboard },
    { label: 'Appointments', link: '/appointments', icon: Calendar },
    { label: 'Prescriptions', link: '/prescriptions', icon: Pill },
    { label: 'Payments', link: '/payments', icon: CreditCard },
    { label: 'Settings', link: '/settings', icon: SettingsIcon }
  ];

  constructor(private authService: AuthService, public router: Router) { }

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = {
          name: user.fullName,
          role: user.userType,
          initials: this.getInitials(user.fullName),
          email: user.email
        };
      }
    });
  }

  ngOnDestroy() { this.userSub.unsubscribe(); }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  toggleMenu() { this.isMobileMenuOpen = !this.isMobileMenuOpen; }
  closeMenu() { this.isMobileMenuOpen = false; }

  isItemActive(item: NavItem): boolean {
    if (!this.router?.url) return false;
    if (item.link && this.router.url === item.link) return true;
    if (item.link && this.router.url.startsWith(item.link) && item.link !== '/') return true;
    return false;
  }

  toggleSidebarCollapse() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') this.closeMenu();
  }
}

export interface NavItem {
  label: string;
  icon: any;
  link?: string;
  isHeader?: boolean;
}

export interface UserProfile {
  name: string;
  role: string;
  initials: string;
  email: string;
}
