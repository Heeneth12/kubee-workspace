import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { ApiResponse, ValidationErrors } from './catalog.models';

export interface ApiError {
  status: number;
  message: string;
  fields: ValidationErrors;
}

export function readApiError(err: HttpErrorResponse): ApiError {
  const body = err?.error as ApiResponse<ValidationErrors> | null;
  return {
    status: err?.status ?? 0,
    message: body?.message ?? (err?.status === 0 ? 'Cannot reach the POS server' : 'Something went wrong'),
    fields: err?.status === 400 && body?.data ? body.data : {},
  };
}

/**
 * Puts 400 field errors on the matching form controls as `{ server: message }`.
 * Paths like `variants[0].name` resolve into FormArrays. Returns the errors that matched no control.
 */
export function applyServerErrors(form: AbstractControl, fields: ValidationErrors): string[] {
  const unmatched: string[] = [];
  for (const [path, message] of Object.entries(fields)) {
    const segments = path.split(/[.[\]]/).filter(Boolean).map(s => (/^\d+$/.test(s) ? +s : s));
    const control = form.get(segments);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), server: message });
      control.markAsTouched();
    } else {
      unmatched.push(`${path}: ${message}`);
    }
  }
  return unmatched;
}

/** First error message to show under a control, or null while untouched / valid. */
export function controlError(control: AbstractControl | null): string | null {
  if (!control || !control.errors || !control.touched) return null;
  const e = control.errors;
  if (e['server']) return e['server'];
  if (e['required']) return 'Required';
  if (e['maxlength']) return `Max ${e['maxlength'].requiredLength} characters`;
  if (e['min']) return `Must be at least ${e['min'].min}`;
  if (e['pattern']) return 'Invalid format';
  return 'Invalid value';
}

/** Trims strings and turns blanks into null, so optional fields are sent as `null`. */
export function blankToNull(value: string | null | undefined): string | null {
  const v = (value ?? '').toString().trim();
  return v ? v : null;
}

/** Number input value -> number or null (empty input). */
export function numOrNull(value: unknown): number | null {
  return value === '' || value === null || value === undefined ? null : Number(value);
}
