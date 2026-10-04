import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmationModalComponent, DrawerComponent, LoaderComponent, ModalComponent, ToastComponent } from 'kubee-ui';
import { BannerLoaderComponent } from './layouts/components/banner-loader/banner-loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, BannerLoaderComponent, ConfirmationModalComponent, LoaderComponent, ModalComponent, DrawerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'kubee-pos';
}
