import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TenantsService } from '../tenants.service';
import { CommonService } from '../../../layout/service/common/common.service';
import { ToastService } from 'kubee-ui';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './tenant-form.component.html'
})
export class TenantFormComponent implements OnInit {
  tenantForm: FormGroup;
  isEditing = false;
  tenantId: number | null = null;
  isLoading = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private tenantsService: TenantsService,
    private commonService: CommonService,
    private toast: ToastService
  ) {
    this.tenantForm = this.fb.group({
      tenantName: ['', Validators.required],
      tenantCode: [''], 
      adminFullName: ['', Validators.required],
      adminEmail: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required], 
      adminPhone: [''],
      appKey: ['', Validators.required],
      isPersonal: [false],
      isActive: [true] 
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditing = true;
        this.tenantId = +id;
        
        // Remove create-specific validation for editing
        this.tenantForm.get('password')?.clearValidators();
        this.tenantForm.get('password')?.updateValueAndValidity();
        this.tenantForm.get('adminFullName')?.clearValidators();
        this.tenantForm.get('adminFullName')?.updateValueAndValidity();
        this.tenantForm.get('adminEmail')?.clearValidators();
        this.tenantForm.get('adminEmail')?.updateValueAndValidity();
        this.tenantForm.get('appKey')?.clearValidators();
        this.tenantForm.get('appKey')?.updateValueAndValidity();

        this.loadTenant(this.tenantId);
      }
    });
  }

  loadTenant(id: number) {
    this.isLoading = true;
    this.tenantsService.getById(id, 
      (res: any) => {
        const tenant = res.data;
        this.tenantForm.patchValue({
          tenantName: tenant.tenantName,
          tenantCode: tenant.tenantCode,
          isActive: tenant.isActive
        });
        this.isLoading = false;
      },
      (error: any) => {
        this.toast.show(error.message || 'Failed to load tenant', 'error');
        this.isLoading = false;
        this.router.navigate(['/tenants']);
      }
    );
  }

  onSubmit() {
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.tenantForm.value;

    if (this.isEditing && this.tenantId) {
      const updateData = {
        tenantName: formData.tenantName,
        tenantCode: formData.tenantCode,
        isActive: formData.isActive
      };
      
      this.tenantsService.update(this.tenantId, updateData,
        (res: any) => {
          this.toast.show('Tenant updated successfully', 'success');
          this.router.navigate(['/tenants']);
          this.isSubmitting = false;
        },
        (error: any) => {
          this.toast.show(error.message || 'Failed to update tenant', 'error');
          this.isSubmitting = false;
        }
      );
    } else {
      const registerData = {
        tenantName: formData.tenantName,
        adminFullName: formData.adminFullName,
        adminEmail: formData.adminEmail,
        password: formData.password,
        adminPhone: formData.adminPhone,
        appKey: formData.appKey,
        isPersonal: formData.isPersonal
      };

      this.commonService.createTenant(registerData,
        (res: any) => {
          this.toast.show('Tenant created successfully', 'success');
          this.router.navigate(['/tenants']);
          this.isSubmitting = false;
        },
        (error: any) => {
          this.toast.show(error.message || 'Failed to create tenant', 'error');
          this.isSubmitting = false;
        }
      );
    }
  }
}
