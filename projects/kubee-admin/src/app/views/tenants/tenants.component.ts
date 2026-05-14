import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TenantsService } from './tenants.service';
import { DrawerService, ToastService } from 'kubee-ui';
import { TenantModel } from '../../layout/models/tenant.model';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './tenants.component.html',
})
export class TenantsComponent implements OnInit {
  
  @ViewChild('tenantDetails') tenantDetailsTemplate!: TemplateRef<any>;

  page = 0;
  size = 10;
  totalItems = 0;
  searchControl = new FormControl('');
  tenants: TenantModel[] = [];
  isLoading = false;
  selectedTenant: any = null;

  constructor(
    private service: TenantsService,
    private toast: ToastService,
    private drawerSvc: DrawerService
  ) {}

  ngOnInit() { 
    this.load(); 
    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(value => {
      this.page = 0;
      this.load();
    });
  }
              
  load() {
    this.isLoading = true;
    const filter = {
      tenantName: this.searchControl.value,
    };
    this.service.getAllTenants(
      this.page,
      this.size,
      filter,
      (res: any) => { 
        this.tenants = res.data.content.map((tenant: any) => tenant as TenantModel) ?? []; 
        this.totalItems = res.data.totalElements ?? 0;
        this.page = res.data.page ?? 0;
        this.size = res.data.size ?? 10;
        this.isLoading = false;
      },
      (err: any) => { 
        this.isLoading = false; 
        this.toast.show('Failed to load tenants', 'error'); 
      }
    );
  }

  viewTenantDetails(tenant: any) {
    this.selectedTenant = tenant;
    this.drawerSvc.openTemplate(this.tenantDetailsTemplate, 'Tenant Details', 'lg');
  }
}