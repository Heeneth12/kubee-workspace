import { Component } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { map } from 'rxjs';
import { PosService } from '../pos/pos.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  stats$;

  constructor(private posService: PosService) {
    this.stats$ = this.posService.orders$.pipe(
      map(orders => {
        const revenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
        return {
          orders: orders.length,
          revenue,
          avgTicket: orders.length ? revenue / orders.length : 0,
          itemsSold: orders.reduce((sum, o) => sum + o.lines.reduce((s, l) => s + l.quantity, 0), 0),
        };
      })
    );
  }
}
