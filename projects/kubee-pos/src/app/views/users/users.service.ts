import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../catalog/catalog.models';
import { AppModule, AppSummary, SaveUserRequest, SpringPage, UserDetail, UserSummary } from './users.models';

/** Staff accounts and their KUBEE_POS privileges, managed in ezauth. */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly userBase = environment.authUrl + '/api/v1/user';
  private readonly commonBase = environment.authUrl + '/api/v1/common';

  searchUsers(page: number, size: number, searchQuery?: string): Observable<SpringPage<UserSummary>> {
    return this.unwrap(this.http.post<ApiResponse<SpringPage<UserSummary>>>(
      `${this.userBase}/all`, { searchQuery: searchQuery || null }, { params: { page, size } }));
  }
  getUser(id: number): Observable<UserDetail> {
    return this.unwrap(this.http.get<ApiResponse<UserDetail>>(`${this.userBase}/${id}`));
  }
  createUser(body: SaveUserRequest): Observable<unknown> {
    return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.userBase}/create`, body));
  }
  updateUser(id: number, body: SaveUserRequest): Observable<unknown> {
    return this.unwrap(this.http.put<ApiResponse<unknown>>(`${this.userBase}/${id}`, body));
  }
  toggleStatus(id: number): Observable<unknown> {
    return this.unwrap(this.http.put<ApiResponse<unknown>>(`${this.userBase}/${id}/toggle-status`, {}));
  }

  /** The tenant's copy of this app (KUBEE_POS). */
  getPosApp(): Observable<AppSummary | undefined> {
    return this.unwrap(this.http.get<ApiResponse<AppSummary[]>>(`${this.commonBase}/app/all`))
      .pipe(map(apps => apps.find(app => app.appKey === environment.appKey)));
  }
  getModules(appId: number): Observable<AppModule[]> {
    return this.unwrap(this.http.get<ApiResponse<AppModule[]>>(`${this.commonBase}/apps/${appId}/modules`));
  }

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map(res => res.data as T));
  }
}
