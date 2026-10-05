import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddonGroup, AddonGroupRequest, ApiResponse, Category, CategoryRequest,
  Item, ItemLookup, ItemRequest, ItemSearchParams, PageResult,
} from './catalog.models';

/** Kubee POS catalog API. Unwraps the `ApiResponse` envelope and returns plain models. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.devUrl + '/api/v1/catalog'; // POS backend, e.g. http://localhost:8086

  // ---------- categories ----------
  listCategories(active?: boolean): Observable<Category[]> {
    return this.get<Category[]>('/categories', { active });
  }
  getCategory(uuid: string): Observable<Category> {
    return this.get<Category>(`/categories/${uuid}`);
  }
  createCategory(body: CategoryRequest): Observable<Category> {
    return this.unwrap(this.http.post<ApiResponse<Category>>(`${this.base}/categories`, body));
  }
  updateCategory(uuid: string, body: CategoryRequest): Observable<Category> {
    return this.unwrap(this.http.put<ApiResponse<Category>>(`${this.base}/categories/${uuid}`, body));
  }
  deleteCategory(uuid: string): Observable<void> {
    return this.delete(`/categories/${uuid}`);
  }

  // ---------- items ----------
  searchItems(params: ItemSearchParams = {}): Observable<PageResult<Item>> {
    return this.get<PageResult<Item>>('/items', { ...params });
  }
  lookupItem(code: string): Observable<ItemLookup> {
    return this.get<ItemLookup>('/items/lookup', { code });
  }
  getItem(uuid: string): Observable<Item> {
    return this.get<Item>(`/items/${uuid}`);
  }
  createItem(body: ItemRequest): Observable<Item> {
    return this.unwrap(this.http.post<ApiResponse<Item>>(`${this.base}/items`, body));
  }
  /** Full replace: send the complete item, including every variant you want to keep (with uuid). */
  updateItem(uuid: string, body: ItemRequest): Observable<Item> {
    return this.unwrap(this.http.put<ApiResponse<Item>>(`${this.base}/items/${uuid}`, body));
  }
  setItemActive(uuid: string, active: boolean): Observable<Item> {
    return this.unwrap(this.http.patch<ApiResponse<Item>>(`${this.base}/items/${uuid}/active`, { active }));
  }
  setItemFavourite(uuid: string, favourite: boolean): Observable<Item> {
    return this.unwrap(this.http.patch<ApiResponse<Item>>(`${this.base}/items/${uuid}/favourite`, { favourite }));
  }
  deleteItem(uuid: string): Observable<void> {
    return this.delete(`/items/${uuid}`);
  }

  // ---------- add-on groups ----------
  listAddonGroups(active?: boolean): Observable<AddonGroup[]> {
    return this.get<AddonGroup[]>('/addon-groups', { active });
  }
  getAddonGroup(uuid: string): Observable<AddonGroup> {
    return this.get<AddonGroup>(`/addon-groups/${uuid}`);
  }
  createAddonGroup(body: AddonGroupRequest): Observable<AddonGroup> {
    return this.unwrap(this.http.post<ApiResponse<AddonGroup>>(`${this.base}/addon-groups`, body));
  }
  updateAddonGroup(uuid: string, body: AddonGroupRequest): Observable<AddonGroup> {
    return this.unwrap(this.http.put<ApiResponse<AddonGroup>>(`${this.base}/addon-groups/${uuid}`, body));
  }
  deleteAddonGroup(uuid: string): Observable<void> {
    return this.delete(`/addon-groups/${uuid}`);
  }

  // ---------- helpers ----------
  private get<T>(path: string, query: Record<string, string | number | boolean | undefined | null> = {}): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.unwrap(this.http.get<ApiResponse<T>>(`${this.base}${path}`, { params }));
  }

  private delete(path: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}${path}`).pipe(map(() => undefined));
  }

  private unwrap<T>(request: Observable<ApiResponse<T>>): Observable<T> {
    return request.pipe(map(res => res.data as T));
  }
}
