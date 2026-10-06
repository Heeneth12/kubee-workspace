import { HttpErrorResponse } from '@angular/common/http';
import { readApiError } from '../catalog/catalog-errors';

/** Saves a Blob as a file. */
export function saveFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Error message of a blob download (the JSON error envelope arrives as a Blob). */
export async function readBlobError(err: HttpErrorResponse): Promise<string> {
  if (err.error instanceof Blob) {
    try {
      const body = JSON.parse(await err.error.text());
      if (body?.message) return body.message;
    } catch { /* not JSON */ }
  }
  return readApiError(err).message;
}
