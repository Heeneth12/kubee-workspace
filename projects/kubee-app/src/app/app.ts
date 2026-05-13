import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './layouts/guards/auth.service';
import { InventoryLayoutComponent } from "./layouts/components/inventory-layout/inventory-layout.component";
import { ToastComponent } from "../../../kubee-ui/src/lib/components/toast/toast.component";
import { BannerLoaderComponent } from "./layouts/components/banner-loader/banner-loader.component";
import { ConfirmationModalComponent } from "../../../kubee-ui/src/lib/components/confirmation-modal/confirmation-modal.component";
import { LoaderComponent } from "../../../kubee-ui/src/lib/components/loader/loader.component";
import { VendorLayoutComponent } from "./layouts/components/vendor-layout/vendor-layout.component";
import { AsyncPipe } from '@angular/common';
import { DrawerComponent, ModalComponent } from 'kubee-ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AsyncPipe, InventoryLayoutComponent, ToastComponent, BannerLoaderComponent, ConfirmationModalComponent, LoaderComponent, VendorLayoutComponent, ModalComponent, DrawerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'inventory-management-system';

  constructor(public authSvc: AuthService) { }
}
