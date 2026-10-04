import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpService } from 'kubee-ui';
import { environment } from '../../../environments/environment';
import { PosOrder } from './pos.model';

@Injectable({
    providedIn: 'root'
})
export class PosService {

    private static ITEMS_BASE_URL = environment.devUrl + '/v1/items';

    // TODO: replace with backend POS order API once available
    private ordersSubject = new BehaviorSubject<PosOrder[]>([]);
    public orders$ = this.ordersSubject.asObservable();

    constructor(private httpService: HttpService) { }

    getItems(page: number, size: number, filter: any, successfn: any, errorfn: any) {
        return this.httpService.postHttp(`${PosService.ITEMS_BASE_URL}/all?page=${page}&size=${size}`, filter, successfn, errorfn);
    }

    saveOrder(order: PosOrder) {
        this.ordersSubject.next([order, ...this.ordersSubject.value]);
    }

    getOrders(): PosOrder[] {
        return this.ordersSubject.value;
    }
}
