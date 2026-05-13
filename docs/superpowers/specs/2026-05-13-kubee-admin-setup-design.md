# kubee-admin Base Setup Design

**Date:** 2026-05-13  
**Status:** Approved

## Overview

Set up the `kubee-admin` Angular application as a SaaS ops panel for internal `KUBEE_OPS` operators. It provides visibility and control over the platform: tenants, users, applications, roles, permissions, resources, audit logs, and subscriptions. The structure mirrors `kubee-app` so the team already knows how to navigate it.

---

## 1. Authentication & Guards

- **Role check:** `userType === 'KUBEE_OPS'` — if the logged-in user is not this type, redirect to `/forbidden`.
- **AuthGuard:** validates token via `CommonService.validateToken()`, fetches user init if token is valid but user data is not in memory. Redirects to `/auth/login` if token is missing/invalid.
- **RedirectGuard:** on `/`, redirect authenticated KUBEE_OPS users to `/dashboard`.
- **No ngx-permissions** — the admin app only needs the single role check above.
- `auth.service.ts` cleanup: remove `NgxPermissionsService` dependency; add `BannerLoaderService` stub in `layout/components/banner-loader/`.
- `auth.model.ts` added to `views/auth/` with `ForgotPasswordModel`, `ResendOtpModel`, `ResetPasswordModel` interfaces.

---

## 2. Routes

```
/auth/login        → AuthComponent                  (public)
/                  → RedirectGuard → /dashboard
/dashboard         → DashboardComponent             [KUBEE_OPS]
/tenants           → tenants.routes.ts              [KUBEE_OPS]
/subscriptions     → subscriptions.routes.ts        [KUBEE_OPS]
/users             → users.routes.ts                [KUBEE_OPS]
/applications      → applications.routes.ts         [KUBEE_OPS]
/roles             → roles.routes.ts                [KUBEE_OPS]
/permissions       → permissions.routes.ts          [KUBEE_OPS]
/resources         → resources.routes.ts            [KUBEE_OPS]
/audit-logs        → audit-logs.routes.ts           [KUBEE_OPS]
/forbidden         → ForbiddenComponent             (public)
```

All guarded routes use `canActivate: [AuthGuard]` with `data: { moduleKey: 'KUBEE_OPS' }`.

---

## 3. Layout Cleanup

`admin-layout.html` currently references three components that do not exist:
- `<app-branch-selector>` — **removed**
- `<app-notifications>` — **removed**
- `<app-ai-chat>` — **removed**
- `<app-custom-dropdown>` — imported from `kubee-ui` library

The sidebar nav items are replaced with the new admin nav structure (see Section 4).

---

## 4. Sidebar Navigation

```
PLATFORM
  Dashboard       /dashboard
  Tenants         /tenants
  Subscriptions   /subscriptions

ACCESS CONTROL
  Users           /users
  Applications    /applications
  Roles           /roles
  Permissions     /permissions
  Resources       /resources

MONITORING
  Audit Logs      /audit-logs
```

`AdminLayout.allNavItems` is rewritten to match the above groups. Section headers use the existing `isHeader: true` pattern.

---

## 5. Feature Views (per module)

Each of the 9 feature modules (tenants, subscriptions, users, applications, roles, permissions, resources, audit-logs, dashboard) follows this shape:

```
views/<feature>/
  <feature>.component.ts    ← list page: search input + table + pagination placeholder
  <feature>.component.html
  <feature>.service.ts      ← getAll(), getById(), create(), update(), delete() stubs
  <feature>.routes.ts       ← child routes (list at '', detail/form at ':id' if needed)
```

Service method URLs are stubbed as `TODO: fill from Swagger` comments. They will be populated once the OpenAPI spec (`GET /v3/api-docs`) is provided.

---

## 6. New Files to Create

| File | Purpose |
|------|---------|
| `layout/components/banner-loader/banner-loader.service.ts` | Stub service (show/hide loader) — depended on by auth.service |
| `views/auth/auth.model.ts` | ForgotPasswordModel, ResendOtpModel, ResetPasswordModel interfaces |
| `views/forbidden/forbidden.component.ts + .html` | 403 page |
| `views/dashboard/dashboard.component.ts + .html + .service.ts` | Platform overview |
| `views/tenants/*` | Tenant management |
| `views/subscriptions/*` | Subscription management |
| `views/users/*` | User management |
| `views/applications/*` | Application management |
| `views/roles/*` | Role management |
| `views/permissions/*` | Permission management |
| `views/resources/*` | Resource management |
| `views/audit-logs/*` | Audit log viewer |

---

## 7. Existing Files to Modify

| File | Change |
|------|--------|
| `app.routes.ts` | Wire all routes with lazy loading + AuthGuard |
| `app.config.ts` | Add `provideHttpClient(withInterceptorsFromDi())`, `HTTP_INTERCEPTORS` for AuthInterceptor |
| `layout/guards/auth.service.ts` | Remove ngx-permissions, use BannerLoaderService stub |
| `layout/guards/auth.guard.ts` | Update permission check to use `userType === 'KUBEE_OPS'` |
| `layout/components/admin-layout/admin-layout.ts` | Replace nav items, remove missing component imports |
| `layout/components/admin-layout/admin-layout.html` | Remove app-branch-selector, app-notifications, app-ai-chat |

---

## 8. Out of Scope

- Detail/form views (create/edit modals) — added later once list views are confirmed
- Real API wiring — done after Swagger spec is shared
- AI Chat sidebar — deferred
- Branch selector — deferred
- Notifications — deferred
