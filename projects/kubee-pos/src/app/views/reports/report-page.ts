import { DestroyRef, Directive, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, Subject, catchError, combineLatest, distinctUntilChanged, map, of, startWith, switchMap, tap } from 'rxjs';
import { ReportPeriod } from './reports.models';
import { isoDate } from '../orders/order-utils';
import { readApiError } from '../catalog/catalog-errors';

export const MAX_REPORT_DAYS = 366;

/** Period from the URL (?from=&to=), defaulting to today, like the API. */
export function readPeriod(params: ParamMap): ReportPeriod {
  const today = isoDate();
  return { from: params.get('from') || today, to: params.get('to') || today };
}

/** Days in an inclusive yyyy-MM-dd range. */
export function periodDays(period: ReportPeriod): number {
  const ms = new Date(period.to + 'T00:00:00').getTime() - new Date(period.from + 'T00:00:00').getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** Client-side check of the API's period rules (it answers 422 otherwise). */
export function periodError(period: ReportPeriod): string | null {
  if (period.from > period.to) return "'From' must be on or before 'To'";
  if (periodDays(period) > MAX_REPORT_DAYS) return `A report can cover at most ${MAX_REPORT_DAYS} days`;
  return null;
}

/**
 * Base for one report tab: loads `fetch(period)` whenever the period in the URL changes
 * (or `reload()` is called), keeping only the latest response.
 */
@Directive()
export abstract class ReportPage<T> implements OnInit {
  protected route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private reload$ = new Subject<void>();

  period: ReportPeriod = readPeriod(this.route.snapshot.queryParamMap);
  data: T | null = null;
  isLoading = false;
  error: string | null = null;

  protected abstract fetch(period: ReportPeriod): Observable<T>;

  ngOnInit() {
    const period$ = this.route.queryParamMap.pipe(
      map(readPeriod),
      distinctUntilChanged((a, b) => a.from === b.from && a.to === b.to),
    );
    combineLatest([period$, this.reload$.pipe(startWith(undefined))]).pipe(
      tap(([period]) => this.period = period),
      switchMap(([period]) => {
        const invalid = periodError(period);
        if (invalid) return of({ error: invalid });
        this.isLoading = true;
        this.error = null;
        return this.fetch(period).pipe(
          map(data => ({ data })),
          catchError((err: HttpErrorResponse) => of({ error: readApiError(err).message })),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(result => {
      this.isLoading = false;
      if ('data' in result) {
        this.data = result.data;
        this.error = null;
      } else {
        this.data = null;
        this.error = result.error;
      }
    });
  }

  reload() {
    this.reload$.next();
  }

  /** A user uuid shown as "You" for the signed-in user, else shortened. */
  who(userUuid: string | null): string {
    if (!userUuid) return '-';
    return userUuid === sessionStorage.getItem('currentUserUuid') ? 'You' : userUuid.slice(0, 8);
  }
}
