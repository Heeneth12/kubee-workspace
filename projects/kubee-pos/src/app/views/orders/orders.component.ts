import { Component } from '@angular/core';
import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { PosService } from '../pos/pos.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe],
  templateUrl: './orders.component.html',
})
export class OrdersComponent {
  constructor(public posService: PosService) { }
}
