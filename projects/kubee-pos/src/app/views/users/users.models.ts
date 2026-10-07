// Shapes of the ezauth user-management API (/api/v1/user, /api/v1/common).

export interface UserSummary {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  userType: string;
  isActive: boolean;
  roles: string[] | null;
}

export interface UserDetail extends UserSummary {
  applicationIds: number[] | null;
  userApplications: {
    applicationId: number;
    modulePrivileges: { moduleId: number; privilegeId: number; privilegeKey: string }[];
  }[] | null;
}

export interface AppPrivilege {
  id: number;
  privilegeName: string;
  privilegeKey: string;
}

export interface AppModule {
  id: number;
  moduleName: string;
  moduleKey: string;
  isActive: boolean;
  privileges: AppPrivilege[] | null;
}

export interface AppSummary {
  id: number;
  appName: string;
  appKey: string;
}

export interface PrivilegeAssignRequest {
  applicationId: number;
  moduleId: number;
  privilegeIds: number[];
}

/** Create and update share this body; roleIds is omitted so existing roles are kept. */
export interface SaveUserRequest {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  userType: string;
  applicationIds: number[];
  privilegeMapping: PrivilegeAssignRequest[];
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}
