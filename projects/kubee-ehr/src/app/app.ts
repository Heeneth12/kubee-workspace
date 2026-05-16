import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DrawerComponent, LoaderComponent, ModalComponent, ToastComponent } from 'kubee-ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, LoaderComponent, ModalComponent, DrawerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('kubee-ehr');
}
