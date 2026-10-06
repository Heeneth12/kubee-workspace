import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

interface UserPage {
  data?: { content?: { userUuid: string; fullName: string }[] };
}

/**
 * Names for the user uuids the POS stores (createdBy, cancelledBy, refundedBy, staff report ...),
 * from the shop's user list in ezauth. Loaded once per session; unknown uuids fall back to a short id.
 */
@Injectable({ providedIn: 'root' })
export class StaffDirectoryService {
  private readonly http = inject(HttpClient);
  private names = new Map<string, string>();
  private loading = false;
  private loaded = false;

  /** Starts loading the user list (no-op once loaded). Names show up on the next change detection. */
  ensureLoaded() {
    if (this.loaded || this.loading) return;
    const tenantId = sessionStorage.getItem('tenantId');
    if (!tenantId) return;
    this.loading = true;
    // ezauth filters by the tenantId in the body, so always send the signed-in shop's id
    this.http.post<UserPage>(`${environment.authUrl}/api/v1/user/all`, { tenantId: Number(tenantId) },
      { params: { page: 0, size: 500 } }).subscribe({
      next: res => {
        (res.data?.content ?? []).forEach(u => this.names.set(u.userUuid, u.fullName));
        this.loading = false;
        this.loaded = true;
      },
      error: () => { this.loading = false; /* fall back to short ids */ }
    });
  }

  /** "You", the user's name, or a short id. */
  name(userUuid: string | null | undefined): string {
    if (!userUuid) return '-';
    if (userUuid === sessionStorage.getItem('currentUserUuid')) return 'You';
    return this.names.get(userUuid) ?? userUuid.slice(0, 8);
  }

  /** Forget cached names (e.g. on logout). */
  reset() {
    this.names.clear();
    this.loaded = false;
  }
}
