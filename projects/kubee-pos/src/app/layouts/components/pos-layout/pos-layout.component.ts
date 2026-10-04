import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  LucideAngularModule,
  LayoutDashboard,
  ShoppingCart,
  ReceiptText,
  ChevronLeft,
  Menu,
  X,
  LogOut,
} from 'lucide-angular';
import { AuthService } from '../../guards/auth.service';

@Component({
  selector: 'app-pos-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './pos-layout.component.html',
})
export class PosLayoutComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  isSidebarCollapsed = false;
  private userSub = new Subscription();

  readonly ChevronLeft = ChevronLeft;
  readonly Menu = Menu;
  readonly XIcon = X;
  readonly LogOut = LogOut;

  user: UserProfile = { name: '', role: '', initials: '', email: '' };

  navItems: NavItem[] = [
    { label: 'Terminal', link: '/pos', icon: ShoppingCart },
    { label: 'Orders', link: '/orders', icon: ReceiptText },
    { label: 'Dashboard', link: '/dashboard', icon: LayoutDashboard },
  ];

  constructor(public authService: AuthService, public router: Router) { }

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
}

export interface UserProfile {
  name: string;
  role: string;
  initials: string;
  email: string;
}
