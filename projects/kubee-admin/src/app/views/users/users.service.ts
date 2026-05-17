import { Injectable } from '@angular/core';
import { HttpService } from 'kubee-ui';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class UsersService {

  private static BASE_URL = environment.authUrl;
  private static URL = `${UsersService.BASE_URL}/api/v1/user`;

  constructor(private http: HttpService) { }

  createUser(data: any, success: any, error: any) {
    return this.http.postHttp(
      `${UsersService.URL}/create`,
      data,
      success,
      error
    );
  }

  getAllUsers(page: number, size: number, filter: any, success: any, error: any) {
    return this.http.postHttp(
      `${UsersService.URL}/all?page=${page}&size=${size}`,
      filter,
      success,
      error
    );
  }

  getBulkUsers(
    ids: number[],
    includeAddress: boolean,
    success: any,
    error: any
  ) {
    const query = ids.map(id => `ids=${id}`).join('&');

    return this.http.getHttp(
      `${UsersService.URL}/bulk?${query}&address=${includeAddress}`,
      success,
      error
    );
  }

  getUserById(id: number, success: any, error: any) {
    return this.http.getHttp(
      `${UsersService.URL}/${id}`,
      success,
      error
    );
  }

  updateUser(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(
      `${UsersService.URL}/${id}`,
      data,
      success,
      error
    );
  }

  toggleUserStatus(id: number, success: any, error: any) {
    return this.http.putHttp(
      `${UsersService.URL}/${id}/toggle-status`,
      {},
      success,
      error
    );
  }

  searchUsers(
    page: number,
    size: number,
    filter: any,
    success: any,
    error: any
  ) {
    return this.http.postHttp(
      `${UsersService.URL}/search?page=${page}&size=${size}`,
      filter,
      success,
      error
    );
  }

  addAddress(id: number, data: any, success: any, error: any) {
    return this.http.postHttp(
      `${UsersService.URL}/${id}/address`,
      data,
      success,
      error
    );
  }

  updateAddress(
    id: number,
    addressId: number,
    data: any,
    success: any,
    error: any
  ) {
    return this.http.putHttp(
      `${UsersService.URL}/${id}/address/${addressId}`,
      data,
      success,
      error
    );
  }

  getCurrentUser(success: any, error: any) {
    return this.http.getHttp(
      `${UsersService.URL}/me`,
      success,
      error
    );
  }

  getAddresses(id: number, success: any, error: any) {
    return this.http.getHttp(
      `${UsersService.URL}/${id}/addresses`,
      success,
      error
    );
  }

  deleteAddress(
    id: number,
    addressId: number,
    success: any,
    error: any
  ) {
    return this.http.deleteHttp(
      `${UsersService.URL}/${id}/address/${addressId}`,
      success,
      error
    );
  }
}