import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ApplicationsService } from './applications.service';
import { ToastService, ModalService, DrawerService } from 'kubee-ui';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './applications.component.html',
})
export class ApplicationsComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  filteredItems: any[] = [];
  isLoading = false;
  isSubmitting = false;

  isEditing = false;
  editingId: number | null = null;
  appForm: FormGroup;

  @ViewChild('createOrEditModalApp') createOrEditModalApp!: TemplateRef<any>;
  @ViewChild('appRolesDrawer') appRolesDrawer!: TemplateRef<any>;

  constructor(
    private service: ApplicationsService,
    private toast: ToastService,
    private fb: FormBuilder,
    private modalService: ModalService
  ) {
    this.appForm = this.fb.group({
      appName: ['', Validators.required],
      appKey: ['', Validators.required],
      description: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.load();
    this.searchControl.valueChanges.subscribe(val => {
      this.filterItems(val || '');
    });
  }

  load() {
    this.isLoading = true;
    this.service.getAllApplications(
      (res: any) => {
        this.items = res.data ?? [];
        this.filterItems(this.searchControl.value || '');
        this.isLoading = false;
      },
      (error: any) => {
        this.toast.show(error.message || 'Failed to load applications', 'error');
        this.isLoading = false;
      }
    );
  }

  filterItems(term: string) {
    const lowerTerm = term.toLowerCase();
    this.filteredItems = this.items.filter(item =>
      (item.appName?.toLowerCase().includes(lowerTerm)) ||
      (item.appKey?.toLowerCase().includes(lowerTerm)) ||
      (item.name?.toLowerCase().includes(lowerTerm))
    );
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingId = null;
    this.appForm.reset({ isActive: true });
    this.modalService.openTemplate(this.createOrEditModalApp, 'createOrEditModalApp', 'lg');
  }

  openEditModal(item: any) {
    this.isEditing = true;
    this.editingId = item.id;
    this.appForm.patchValue({
      appName: item.appName || item.name,
      appKey: item.appKey,
      description: item.description,
      isActive: item.isActive
    });
    this.modalService.openTemplate(this.createOrEditModalApp, 'createOrEditModalApp', 'lg');
  }

  closeModal() {
    this.modalService.close();
  }

  onSubmit() {
    if (this.appForm.invalid) {
      this.appForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.appForm.value;

    if (this.isEditing && this.editingId) {
      this.service.updateApplication(this.editingId, formData,
        (res: any) => {
          this.toast.show('Application updated successfully', 'success');
          this.closeModal();
          this.load();
          this.isSubmitting = false;
        },
        (error: any) => {
          this.toast.show(error.message || 'Failed to update application', 'error');
          this.isSubmitting = false;
        }
      );
    } else {
      this.service.createApplication(formData,
        (res: any) => {
          this.toast.show('Application created successfully', 'success');
          this.closeModal();
          this.load();
          this.isSubmitting = false;
        },
        (error: any) => {
          this.toast.show(error.message || 'Failed to create application', 'error');
          this.isSubmitting = false;
        }
      );
    }
  }

  deleteApplication(id: number) {
    if (confirm('Are you sure you want to delete this application?')) {
      this.service.deleteApplication(id,
        (res: any) => {
          this.toast.show('Application deleted successfully', 'success');
          this.load();
        },
        (error: any) => {
          this.toast.show(error.message || 'Failed to delete application', 'error');
        }
      );
    }
  }

  viewRoles(item: any) {

  }
}
