import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './layouts/guards/auth.service';
import { InventoryLayoutComponent } from "./layouts/components/inventory-layout/inventory-layout.component";
import { ToastComponent } from "./layouts/components/toast/toast.component";
import { BannerLoaderComponent } from "./layouts/components/banner-loader/banner-loader.component";
import { ConfirmationModalComponent } from "./layouts/UI/confirmation-modal/confirmation-modal.component";
import { ModalComponent } from "./layouts/components/modal/modal.component";
import { DrawerComponent } from "./layouts/components/drawer/drawer.component";
import { LoaderComponent } from "./layouts/components/loader/loader.component";
import { VendorLayoutComponent } from "./layouts/components/vendor-layout/vendor-layout.component";
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AsyncPipe, InventoryLayoutComponent, ToastComponent, BannerLoaderComponent, ConfirmationModalComponent, ModalComponent, DrawerComponent, LoaderComponent, VendorLayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'inventory-management-system';

  constructor(public authSvc: AuthService) { }
}
