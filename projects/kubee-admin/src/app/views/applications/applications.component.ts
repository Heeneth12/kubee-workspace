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

  // App form
  isEditing = false;
  editingId: number | null = null;
  isSubmitting = false;
  appForm: FormGroup;

  // Module management
  selectedApp: any = null;
  expandedModuleId: number | null = null;
  isEditingModule = false;
  editingModuleId: number | null = null;
  isSubmittingModule = false;
  moduleForm: FormGroup;

  // Privilege management
  activePrivilegeModuleId: number | null = null;
  isEditingPrivilege = false;
  editingPrivilegeId: number | null = null;
  isSubmittingPrivilege = false;
  privilegeForm: FormGroup;

  @ViewChild('createOrEditModalApp') createOrEditModalApp!: TemplateRef<any>;
  @ViewChild('modulesDrawer') modulesDrawer!: TemplateRef<any>;
  @ViewChild('moduleFormModal') moduleFormModal!: TemplateRef<any>;
  @ViewChild('privilegeFormModal') privilegeFormModal!: TemplateRef<any>;

  constructor(
    private service: ApplicationsService,
    private toast: ToastService,
    private fb: FormBuilder,
    private modalService: ModalService,
    private drawerService: DrawerService
  ) {
    this.appForm = this.fb.group({
      appName: ['', Validators.required],
      appKey: ['', Validators.required],
      description: [''],
      isActive: [true]
    });

    this.moduleForm = this.fb.group({
      moduleName: ['', Validators.required],
      moduleKey: ['', Validators.required],
      description: [''],
      isActive: [true]
    });

    this.privilegeForm = this.fb.group({
      privilegeName: ['', Validators.required],
      privilegeKey: ['', Validators.required],
      description: ['']
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
        this.refreshSelectedApp();
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
      (item.appKey?.toLowerCase().includes(lowerTerm))
    );
  }

  // ─── Application CRUD ─────────────────────────────────────────────────────

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
      appName: item.appName,
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
        () => {
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
        () => {
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
        () => {
          this.toast.show('Application deleted successfully', 'success');
          if (this.selectedApp?.id === id) {
            this.drawerService.close();
            this.selectedApp = null;
          }
          this.load();
        },
        (error: any) => {
          this.toast.show(error.message || 'Failed to delete application', 'error');
        }
      );
    }
  }

  // ─── Modules Drawer ───────────────────────────────────────────────────────

  openModulesDrawer(app: any) {
    this.selectedApp = app;
    this.expandedModuleId = null;
    this.drawerService.openTemplate(this.modulesDrawer, `${app.appName} — Modules`, 'xl');
  }

  refreshSelectedApp() {
    if (this.selectedApp) {
      const updated = this.items.find(i => i.id === this.selectedApp.id);
      if (updated) this.selectedApp = updated;
    }
  }

  toggleModule(moduleId: number) {
    this.expandedModuleId = this.expandedModuleId === moduleId ? null : moduleId;
  }

  moduleList(): any[] {
    if (!this.selectedApp?.modules) return [];
    return Array.isArray(this.selectedApp.modules)
      ? this.selectedApp.modules
      : Array.from(this.selectedApp.modules);
  }

  privilegeList(module: any): any[] {
    if (!module?.privileges) return [];
    return Array.isArray(module.privileges)
      ? module.privileges
      : Array.from(module.privileges);
  }

  // ─── Module CRUD ──────────────────────────────────────────────────────────

  openModuleForm(module?: any) {
    if (module) {
      this.isEditingModule = true;
      this.editingModuleId = module.id;
      this.moduleForm.patchValue({
        moduleName: module.moduleName,
        moduleKey: module.moduleKey,
        description: module.description,
        isActive: module.isActive
      });
    } else {
      this.isEditingModule = false;
      this.editingModuleId = null;
      this.moduleForm.reset({ isActive: true });
    }
    this.modalService.openTemplate(this.moduleFormModal, 'moduleFormModal', 'md');
  }

  submitModuleForm() {
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      return;
    }

    this.isSubmittingModule = true;
    const data = this.moduleForm.value;

    if (this.isEditingModule && this.editingModuleId) {
      this.service.updateModule(this.editingModuleId, data,
        () => {
          this.toast.show('Module updated successfully', 'success');
          this.closeModal();
          this.loadAndRefresh();
          this.isSubmittingModule = false;
        },
        (err: any) => {
          this.toast.show(err.message || 'Failed to update module', 'error');
          this.isSubmittingModule = false;
        }
      );
    } else {
      this.service.createModule(this.selectedApp.id, data,
        () => {
          this.toast.show('Module created successfully', 'success');
          this.closeModal();
          this.loadAndRefresh();
          this.isSubmittingModule = false;
        },
        (err: any) => {
          this.toast.show(err.message || 'Failed to create module', 'error');
          this.isSubmittingModule = false;
        }
      );
    }
  }

  deleteModule(moduleId: number) {
    if (!confirm('Delete this module and all its privileges?')) return;
    this.service.deleteModule(moduleId,
      () => {
        this.toast.show('Module deleted successfully', 'success');
        if (this.expandedModuleId === moduleId) this.expandedModuleId = null;
        this.loadAndRefresh();
      },
      (err: any) => this.toast.show(err.message || 'Failed to delete module', 'error')
    );
  }

  // ─── Privilege CRUD ───────────────────────────────────────────────────────

  openPrivilegeForm(moduleId: number, privilege?: any) {
    this.activePrivilegeModuleId = moduleId;
    if (privilege) {
      this.isEditingPrivilege = true;
      this.editingPrivilegeId = privilege.id;
      this.privilegeForm.patchValue({
        privilegeName: privilege.privilegeName,
        privilegeKey: privilege.privilegeKey,
        description: privilege.description
      });
    } else {
      this.isEditingPrivilege = false;
      this.editingPrivilegeId = null;
      this.privilegeForm.reset();
    }
    this.modalService.openTemplate(this.privilegeFormModal, 'privilegeFormModal', 'md');
  }

  submitPrivilegeForm() {
    if (this.privilegeForm.invalid) {
      this.privilegeForm.markAllAsTouched();
      return;
    }

    this.isSubmittingPrivilege = true;
    const data = this.privilegeForm.value;

    if (this.isEditingPrivilege && this.editingPrivilegeId) {
      this.service.updatePrivilege(this.editingPrivilegeId, data,
        () => {
          this.toast.show('Privilege updated successfully', 'success');
          this.closeModal();
          this.loadAndRefresh();
          this.isSubmittingPrivilege = false;
        },
        (err: any) => {
          this.toast.show(err.message || 'Failed to update privilege', 'error');
          this.isSubmittingPrivilege = false;
        }
      );
    } else {
      this.service.createPrivilege(this.activePrivilegeModuleId!, data,
        () => {
          this.toast.show('Privilege created successfully', 'success');
          this.closeModal();
          this.loadAndRefresh();
          this.isSubmittingPrivilege = false;
        },
        (err: any) => {
          this.toast.show(err.message || 'Failed to create privilege', 'error');
          this.isSubmittingPrivilege = false;
        }
      );
    }
  }

  deletePrivilege(privilegeId: number) {
    if (!confirm('Delete this privilege?')) return;
    this.service.deletePrivilege(privilegeId,
      () => {
        this.toast.show('Privilege deleted successfully', 'success');
        this.loadAndRefresh();
      },
      (err: any) => this.toast.show(err.message || 'Failed to delete privilege', 'error')
    );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  loadAndRefresh() {
    this.service.getAllApplications(
      (res: any) => {
        this.items = res.data ?? [];
        this.filterItems(this.searchControl.value || '');
        this.refreshSelectedApp();
      },
      (err: any) => this.toast.show(err.message || 'Failed to refresh data', 'error')
    );
  }
}
