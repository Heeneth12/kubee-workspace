import { Injectable } from "@angular/core";
import { HttpService } from "kubee-ui";
import { environment } from "../../../../environments/environment.development";

@Injectable({
    providedIn: 'root'
})
export class BranchService {

    private static readonly BASE_URL = `${environment.authUrl}/api/v1/branch`;

    constructor(private httpService: HttpService) { }

    /**
     * BRANCH CORE OPERATIONS
     */

    createBranch(request: any, successfn: any, errorfn: any) {
        return this.httpService.postHttp(`${BranchService.BASE_URL}`, request, successfn, errorfn);
    }

    updateBranch(branchId: number, request: any, successfn: any, errorfn: any) {
        return this.httpService.putHttp(`${BranchService.BASE_URL}/${branchId}`, request, successfn, errorfn);
    }

    deleteBranch(branchId: number, successfn: any, errorfn: any) {
        return this.httpService.deleteHttp(`${BranchService.BASE_URL}/${branchId}`, successfn, errorfn);
    }

    getBranchById(branchId: number, successfn: any, errorfn: any) {
        return this.httpService.getHttp(`${BranchService.BASE_URL}/${branchId}`, successfn, errorfn);
    }

    getBranches(successfn: any, errorfn: any) {
        return this.httpService.getHttp(`${BranchService.BASE_URL}`, successfn, errorfn);
    }

    getBranchSummaries(successfn: any, errorfn: any) {
        return this.httpService.getHttp(`${BranchService.BASE_URL}/summary`, successfn, errorfn);
    }

    getMyBranch(successfn: any, errorfn: any) {
        return this.httpService.getHttp(`${BranchService.BASE_URL}/my`, successfn, errorfn);
    }

    /**
     * USER MANAGEMENT PER BRANCH
     */

    getBranchUsers(branchId: number, successfn: any, errorfn: any) {
        return this.httpService.getHttp(`${BranchService.BASE_URL}/${branchId}/users`, successfn, errorfn);
    }

    assignUserToBranch(branchId: number, userId: number, successfn: any, errorfn: any) {
        // Using patchHttp based on your @PatchMapping
        return this.httpService.patchHttp(`${BranchService.BASE_URL}/${branchId}/users/${userId}`, {}, successfn, errorfn);
    }

    removeUserFromBranch(branchId: number, userId: number, successfn: any, errorfn: any) {
        return this.httpService.deleteHttp(`${BranchService.BASE_URL}/${branchId}/users/${userId}`, successfn, errorfn);
    }

    /**
     * ADDRESS MANAGEMENT
     */

    addBranchAddress(branchId: number, request: any, successfn: any, errorfn: any) {
        return this.httpService.postHttp(`${BranchService.BASE_URL}/${branchId}/address`, request, successfn, errorfn);
    }

    deleteBranchAddress(branchId: number, addressId: number, successfn: any, errorfn: any) {
        return this.httpService.deleteHttp(`${BranchService.BASE_URL}/${branchId}/address/${addressId}`, successfn, errorfn);
    }
}