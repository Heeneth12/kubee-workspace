import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  LucideAngularModule,
  LayoutDashboard,
  ShoppingCart,
  ReceiptText,
  BookOpen,
  FileText,
  ChartColumn,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  Wallet,
  Users,
  Settings,
} from 'lucide-angular';
import { AuthService } from '../../guards/auth.service';
import { AuthGuard } from '../../guards/auth.guard';
import { PosModules, PosPrivileges } from '../../guards/pos-permissions';
import { ShiftService } from '../../../views/shifts/shift.service';
import { ShiftView } from '../../../views/shifts/shifts.models';
import { SHIFT_PROMPT_DISMISSED, ShiftDialogComponent } from '../../../views/shifts/shift-dialog.component';

@Component({
  selector: 'app-pos-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, ShiftDialogComponent],
  templateUrl: './pos-layout.component.html',
})
export class PosLayoutComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  isSidebarCollapsed = false;
  private userSub = new Subscription();
  /** undefined = not checked yet, null = no shift open. */
  shift: ShiftView | null | undefined = undefined;

  readonly ChevronLeft = ChevronLeft;
  readonly Menu = Menu;
  readonly XIcon = X;
  readonly LogOut = LogOut;
  readonly Wallet = Wallet;

  user: UserProfile = { name: '', role: '', initials: '', email: '' };

  private readonly allNavItems: NavItem[] = [
    { label: 'Terminal', link: '/pos', icon: ShoppingCart, moduleKey: PosModules.ORDERS, privilegeKey: PosPrivileges.ORDERS_CREATE },
    { label: 'Orders', link: '/orders', icon: ReceiptText, moduleKey: PosModules.ORDERS },
    { label: 'Bills', link: '/bills', icon: FileText, moduleKey: PosModules.BILLS },
    { label: 'Reports', link: '/reports', icon: ChartColumn, moduleKey: PosModules.REPORTS },
    { label: 'Catalog', link: '/catalog', icon: BookOpen, moduleKey: PosModules.CATALOG },
    { label: 'Dashboard', link: '/dashboard', icon: LayoutDashboard, moduleKey: PosModules.DASHBOARD },
    { label: 'Users', link: '/users', icon: Users, moduleKey: PosModules.USER_MGMT },
    { label: 'Settings', link: '/settings', icon: Settings },
  ];
  navItems: NavItem[] = [];

  constructor(public authService: AuthService, private authGuard: AuthGuard, public router: Router, public shiftService: ShiftService) { }

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = {
          name: user.fullName,
          role: user.userType,
          initials: this.getInitials(user.fullName),
          email: user.email
        };
        this.navItems = this.allNavItems.filter(item =>
          (!item.moduleKey || this.authGuard.hasModuleAccess(user, item.moduleKey))
          && (!item.privilegeKey || this.authGuard.hasPrivilege(user, item.privilegeKey)));
      } else {
        this.navItems = [];
      }
    });
    this.userSub.add(this.shiftService.current$.subscribe(shift => this.shift = shift));

    // Start of the day: no open shift -> ask for the opening cash (once per session; shifts aren't enforced)
    this.shiftService.refreshCurrent().subscribe({
      next: shift => {
        if (shift === null && !sessionStorage.getItem(SHIFT_PROMPT_DISMISSED)) this.shiftService.openDialog();
      },
      error: () => { /* badge just stays unknown */ }
    });
  }

  ngOnDestroy() { this.userSub.unsubscribe(); }

  getInitials(name: string): string {
    return (name || '').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  isItemActive(item: NavItem): boolean {
    return !!this.router?.url && this.router.url.startsWith(item.link);
  }

  toggleMenu() { this.isMobileMenuOpen = !this.isMobileMenuOpen; }
  closeMenu() { this.isMobileMenuOpen = false; }
  toggleSidebarCollapse() { this.isSidebarCollapsed = !this.isSidebarCollapsed; }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') this.closeMenu();
  }
}

export interface NavItem {
  label: string;
  icon: any;
  link: string;
  moduleKey?: string;
  privilegeKey?: string;
}

export interface UserProfile {
  name: string;
  role: string;
  initials: string;
  email: string;
}
