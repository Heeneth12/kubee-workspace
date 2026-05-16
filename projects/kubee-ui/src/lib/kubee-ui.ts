import { Component, CUSTOM_ELEMENTS_SCHEMA, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Info, CheckCircle2, AlertTriangle, XCircle, Settings, User, Bell } from 'lucide-angular';

import { ToastService } from './components/toast/toastService';
import { ModalService } from './components/modal/modalService';
import { DrawerService } from './components/drawer/drawerService';
import { LoaderService } from './components/loader/loaderService';
import { ConfirmationModalService } from './components/confirmation-modal/confirmation-modal.service';

import { DatePickerComponent, DatePickerConfig, DateRangeEmit } from './components/date-picker/date-picker.component';
import { CustomDropdownComponent, DropdownMenuItem } from './components/custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'lib-kubee-ui',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DatePickerComponent, CustomDropdownComponent],
  templateUrl: './kubee-ui.html',
  styleUrls: ['./kubee-ui.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KubeeUi {

  // Icons for template
  readonly InfoIcon = Info;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly XCircleIcon = XCircle;
  readonly SettingsIcon = Settings;

  // Template reference for modal
  @ViewChild('modalContent') modalContent!: TemplateRef<any>;
  @ViewChild('drawerContent') drawerContent!: TemplateRef<any>;
  @ViewChild('confirmContent') confirmContent!: TemplateRef<any>;


  constructor(
    private toastService: ToastService,
    private modalService: ModalService,
    private drawerService: DrawerService,
    private loaderService: LoaderService,
    private confirmationService: ConfirmationModalService
  ) { }

  // --- Toast ---
  showToast(type: 'success' | 'error' | 'info' | 'warning') {
    const messages = {
      success: 'Operation completed successfully!',
      error: 'An error occurred during the process.',
      info: 'Here is some information for you.',
      warning: 'Please be careful, this is a warning.'
    };
    this.toastService.show(messages[type], type);
  }

  // --- Modal ---
  openModal() {
    this.modalService.openTemplate(this.modalContent, { title: 'Demo Modal', size: 'md' });
  }

  // --- Drawer ---
  openDrawer() {
    this.drawerService.openTemplate(this.drawerContent, 'Side Drawer', 'lg');
  }

  // --- Loader ---
  showLoader() {
    this.loaderService.show();
    setTimeout(() => {
      this.loaderService.hide();
    }, 2000);
  }

  // --- Confirmation Modal ---
  openConfirm() {
    this.confirmationService.open({
      title: 'Delete Resource?',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      intent: 'delete'
    });
  }

  // --- Date Picker Config ---
  singleDateConfig: DatePickerConfig = {
    type: 'single',
    label: 'Select Single Date',
    placeholder: 'Pick a date'
  };

  rangeDateConfig: DatePickerConfig = {
    type: 'both',
    label: 'Select Date Range',
    placeholder: 'Start - End'
  };

  onDateSelected(event: DateRangeEmit) {
    console.log('Date selected:', event);
  }

  // --- Dropdown Config ---
  dropdownItems: DropdownMenuItem[] = [
    { label: 'Profile', icon: User, action: () => this.toastService.show('Profile clicked', 'info') },
    { label: 'Notifications', icon: Bell, action: () => this.toastService.show('Notifications clicked', 'info') },
    { label: 'Settings', icon: Settings, action: () => this.toastService.show('Settings clicked', 'info') }
  ];
}