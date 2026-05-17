import { Injectable } from '@angular/core';
import { HttpService } from 'kubee-ui';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private static APPLICATION_BASE_URL = environment.authUrl + "/api/v1/common/app";
  private static ROLE_BASE_URL = environment.authUrl + "/api/v1/common/role";

  constructor(private http: HttpService) { }

  // app apis

  getAllApplications(success: any, error: any) {
    return this.http.getHttp(ApplicationsService.APPLICATION_BASE_URL + "/all", success, error);
  }

  createApplication(data: any, success: any, error: any) {
    return this.http.postHttp(`${ApplicationsService.APPLICATION_BASE_URL}/create`, data, success, error);
  }

  updateApplication(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${ApplicationsService.APPLICATION_BASE_URL}/${id}`, data, success, error);
  }

  deleteApplication(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${ApplicationsService.APPLICATION_BASE_URL}/${id}`, success, error);
  }

  // role apis

  getAllRoles(success: any, error: any) {
    return this.http.getHttp(ApplicationsService.ROLE_BASE_URL + "/all", success, error);
  }

  createRole(data: any, success: any, error: any) {
    return this.http.postHttp(`${ApplicationsService.ROLE_BASE_URL}/create`, data, success, error);
  }

  updateRole(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${ApplicationsService.ROLE_BASE_URL}/${id}`, data, success, error);
  }

  deleteRole(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${ApplicationsService.ROLE_BASE_URL}/${id}`, success, error);
  }

}