import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../catalog/catalog.models';
import { CashMovementRequest, CloseShiftRequest, OpenShiftRequest, ShiftView } from './shifts.models';

/**
 * Kubee POS shifts (cash drawer) API, plus the shop's current open shift as shared state
 * so the header badge and the shift dialog stay in sync.
 */
@Injectable({ providedIn: 'root' })
export class ShiftService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.devUrl + '/api/v1/shifts';

  /** undefined = not checked yet, null = no shift open. */
  private currentSubject = new BehaviorSubject<ShiftView | null | undefined>(undefined);
  readonly current$ = this.currentSubject.asObservable();

  /** Opens the shift dialog from anywhere (header, terminal). */
  private dialogSubject = new BehaviorSubject<boolean>(false);
  readonly dialogOpen$ = this.dialogSubject.asObservable();

  get current(): ShiftView | null | undefined {
    return this.currentSubject.value;
  }

  openDialog() { this.dialogSubject.next(true); }
  closeDialog() { this.dialogSubject.next(false); }

  // ---------- API ----------

  /** The open shift with live figures; null when none is open (API 404). */
  refreshCurrent(): Observable<ShiftView | null> {
    return this.unwrap(this.http.get<ApiResponse<ShiftView>>(`${this.base}/current`)).pipe(
      catchError(err => err?.status === 404 ? of(null) : throwError(() => err)),
      tap(shift => this.currentSubject.next(shift)),
    );
  }

  getShift(uuid: string): Observable<ShiftView> {
    return this.unwrap(this.http.get<ApiResponse<ShiftView>>(`${this.base}/${uuid}`));
  }

  /** 409 when a shift is already open (one cash drawer per shop). */
  openShift(body: OpenShiftRequest): Observable<ShiftView> {
    return this.unwrap(this.http.post<ApiResponse<ShiftView>>(this.base, body)).pipe(
      tap(shift => this.currentSubject.next(shift)),
    );
  }

  /** IN = float / change added, OUT = cash paid out. 422 when the shift is closed. */
  addCashMovement(uuid: string, body: CashMovementRequest): Observable<ShiftView> {
    return this.unwrap(this.http.post<ApiResponse<ShiftView>>(`${this.base}/${uuid}/cash-movements`, body)).pipe(
      tap(shift => this.currentSubject.next(shift)),
    );
  }

  /** Stores expected cash and the difference; a closed shift never changes. */
  closeShift(uuid: string, body: CloseShiftRequest): Observable<ShiftView> {
    return this.unwrap(this.http.post<ApiResponse<ShiftView>>(`${this.base}/${uuid}/close`, body)).pipe(
      tap(() => this.currentSubject.next(null)),
    );
  }

  /** Forget the cached state (e.g. on logout). */
  reset() {
    this.currentSubject.next(undefined);
    this.dialogSubject.next(false);
  }

  private unwrap<T>(request: Observable<ApiResponse<T>>): Observable<T> {
    return request.pipe(map(res => res.data as T));
  }
}
