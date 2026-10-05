# Kubee Frontend Workspace
This repository is an Angular Monorepo that houses the entire frontend ecosystem for Kubee. It uses a shared library architecture to maintain a strict separation of concerns while keeping our minimalist design system consistent across multiple distinct applications.

---

## Architecture

The workspace is divided into five core projects:

1. **`kubee-app`**: The primary tenant-facing inventory management application.
2. **`kubee-admin`**: The internal command center for global SaaS management, tenant oversight, and subscription control.
3. **`kubee-ehr`**: The Electronic Health Record (EHR) management application tailored for specific clinical workflows.
4. **`kubee-pos`**: The point-of-sale application: billing terminal (orders, payments, hold/recall), orders with refunds, GST bills (issue, print, share, cancel), reports (day sales, payment modes, item-wise, GST summary, cancellations), dashboard and the catalog (items, categories, add-on groups).
5. **`kubee-ui`**: The shared internal library containing our Tailwind-powered design system, standalone UI components (modals, drawers, toasts, etc.), and global assets.

---

## Running Locally

You can run multiple applications simultaneously. It is recommended to open separate terminal instances for each application.

**1. Start the Tenant App (Port 4200)**
```bash
ng serve kubee-app --port 4200
```
*Accessible at: [http://localhost:4200](http://localhost:4200)*

**2. Start the Admin Dashboard (Port 4201)**
```bash
ng serve kubee-admin --port 4201
```
*Accessible at: [http://localhost:4201](http://localhost:4201)*

**3. Start the EHR Application (Port 4202)**
```bash
ng serve kubee-ehr --port 4202
```
*Accessible at: [http://localhost:4202](http://localhost:4202)*

**4. Start the POS Application (Port 4200)**
```bash
ng serve kubee-pos
```
*Accessible at: [http://localhost:4200](http://localhost:4200). The POS backend's CORS setup allows this origin
(see below), so don't run kubee-app on 4200 at the same time.*

### kubee-pos: backend

The POS screens (terminal, orders, bills, catalog) call the **Kubee POS backend** directly at `environment.devUrl` +
`/api/v1/...` (local: `http://localhost:8086`, set in `projects/kubee-pos/src/environments/environment.development.ts`).

1. Start ezauth (`authUrl`, port `8080`) and the POS backend (port `8086`). Check with:
   ```bash
   lsof -nP -iTCP:8086 -sTCP:LISTEN
   ```
2. Serve the app on a port the backend's CORS config allows (`SecurityConfig.corsConfigurationSource`, currently
   `http://localhost:4200`): `ng serve kubee-pos`. Don't run kubee-app on 4200 at the same time.
3. Sign in. On login **and on every reload**, `AuthGuard` validates the token and calls ezauth `/user/init`.
   Every POS API call sends `Authorization: Bearer <JWT>`. The backend takes the shop (`tenantUuid`) and user
   (`userUuid`) from the token's claims. An expired token is refreshed automatically by `AuthInterceptor`.
4. Open [http://localhost:4200/pos](http://localhost:4200/pos).

API contracts: [`catalog-api.md`](projects/kubee-pos/doc/catalog-api.md),
[`orders-api.md`](projects/kubee-pos/doc/orders-api.md), [`billing-api.md`](projects/kubee-pos/doc/billing-api.md),
[`reports-api.md`](projects/kubee-pos/doc/reports-api.md).

---

## UI Component Test Environment

The `kubee-ui` library contains a built-in interactive dashboard that acts as a showcase for all shared UI components. This environment allows you to test modals, toasts, drawers, and date pickers while viewing the exact code required to implement them.

**To view the UI Test Environment:**
1. Ensure your `kubee-ehr` server is running.
2. Navigate to: [http://localhost:4202/ui-demo](http://localhost:4202/ui-demo)

---

## Development & Component Creation

Because we use a monorepo, it is critical to ensure that shared UI elements are placed in the `kubee-ui` library, while application-specific views (like a dashboard or a settings page) are placed in their respective applications.

### 1. Generating Application-Specific Components
To create a new page or component for a specific application, use the `--project` flag:
```bash
ng generate component views/appointments --project=kubee-ehr
```

### 2. Generating Shared UI Components
All reusable UI elements (buttons, cards, inputs, layout wrappers) must be built inside the shared `kubee-ui` library to ensure design consistency.
```bash
ng generate component components/custom-button --project=kubee-ui
```

**Workflow for Shared Components:**
1. Generate the component using the command above.
2. Implement your component using our shared Tailwind CSS utilities.
3. Export the component in `projects/kubee-ui/src/public-api.ts` so other apps can import it.
4. **CRITICAL:** Rebuild the UI library (see below) before trying to use your new component in an application.

---

## Building for Production & Libraries

### Building the UI Library
Whenever you make changes to files inside the `kubee-ui` folder, you **must** build the library so that the changes are compiled into the `dist/` directory. The applications read from this `dist/` folder.

```bash
ng build kubee-ui
```
*Tip: If an application is throwing a "Cannot find module 'kubee-ui'" error, it means you need to run this build command and restart your `ng serve` process.*

### Building the Applications
The `package.json` includes scripts that build `kubee-ui` first (required), then the target application. Always use these scripts instead of running `ng build` directly.

```bash
npm run build:app    # builds kubee-ui + kubee-app
npm run build:admin  # builds kubee-ui + kubee-admin
npm run build:ehr    # builds kubee-ui + kubee-ehr
npm run build:pos    # builds kubee-ui + kubee-pos
```

> The `npm run build:*` scripts first run `scripts/set-env.js`, which **overwrites** the app's environment files and
> requires the `AUTH_URL` / `API_URL` variables (they are meant for Vercel). To check that everything compiles on your
> machine without touching the environment files, build directly:
>
> ```bash
> ng build kubee-ui && for app in kubee-app kubee-admin kubee-ehr kubee-pos; do ng build $app || break; done
> ```

Build output is written to `dist/<app-name>/browser/`.

---

## Deploying to Vercel

This monorepo is deployed as **separate Vercel projects** (one per app), each pointing at the same GitHub repository but building a different app. The shared `kubee-ui` library is compiled automatically as part of each app's build script.

| Application | Vercel Project | Domain | Build Script | Output Directory |
|---|---|---|---|---|
| `kubee-app` | kubee-app | `app.kubee.in` | `npm run build:app` | `dist/kubee-app/browser` |
| `kubee-admin` | kubee-admin | `ops.kubee.in` | `npm run build:admin` | `dist/kubee-admin/browser` |
| `kubee-ehr` | kubee-ehr | *(your domain)* | `npm run build:ehr` | `dist/kubee-ehr/browser` |
| `kubee-pos` | kubee-pos | *(your domain)* | `npm run build:pos` | `dist/kubee-pos/browser` |

### Step 1 — Create a Vercel Project for Each App

Repeat the following steps once for each application.

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Import this GitHub repository.
3. On the **Configure Project** screen, set the fields as shown in the table above for each app.
   - **Framework Preset**: `Other`
   - **Root Directory**: `.` (leave as the repo root — do not change this)
   - **Build Command**: see table above
   - **Output Directory**: see table above
   - **Install Command**: `npm install`
4. Click **Deploy**.

> **Root Directory must stay as `.`** — the build needs access to `node_modules`, `angular.json`, and the shared `kubee-ui` source at the workspace root. Do not point it at a subdirectory.

### Step 2 — Add Custom Domains

After each project deploys successfully:

1. Open the project in the Vercel dashboard.
2. Go to **Settings → Domains**.
3. Add the domain listed in the table above (e.g. `app.kubee.in`).
4. Vercel will display the DNS record you need to add.

### Step 3 — Configure DNS

In your domain registrar's DNS settings for `kubee.in`, add the following records:

```
Type   Name   Value
CNAME  app    cname.vercel-dns.com
CNAME  ops    cname.vercel-dns.com
```

> If your registrar does not support CNAME on the root domain (`@`), use an ALIAS or ANAME record, or follow the A record instructions Vercel shows in the domain settings panel.

DNS propagation typically takes a few minutes but can take up to 48 hours depending on your registrar.

### Step 4 — Verify the Deployment

Once DNS has propagated, visit each domain to confirm the correct application loads:

- `https://app.kubee.in` — should load `kubee-app`
- `https://ops.kubee.in` — should load `kubee-admin`

---

## Build Configuration Notes

### Why `npm run build:*` instead of `ng build`?

The `kubee-ui` shared library must be compiled before any application that depends on it. The `build:app`, `build:admin`, and `build:ehr` scripts in `package.json` handle this automatically:

```
npm run build:admin  ==  ng build kubee-ui && ng build kubee-admin --configuration production
```

Running `ng build kubee-admin` alone will fail with a "Cannot find module 'kubee-ui'" error if the library has not been built first.

### Google Fonts

The Google Fonts stylesheet (`DM Sans`) is loaded at runtime from the CDN via `@import` in `styles.scss`. Angular's production builder has a font-inlining feature that is **disabled** in this project (`"fonts": { "inline": false }` in `angular.json`) to prevent the font CSS from exceeding component style budgets.

### Bundle Size Budgets

The production budgets in `angular.json` are set to:

| Budget type | Warning | Error |
|---|---|---|
| Initial bundle | 1 MB | 2 MB |
| Any component style | 10 kB | 20 kB |

If you see a budget warning, investigate what was added to the initial chunk before shipping. Lazy-load large feature modules to keep the initial bundle small.

### SPA Routing

The `vercel.json` at the repo root configures all three Vercel projects to redirect unknown paths to `index.html`, which is required for Angular's client-side router to work correctly:

```json
{
  "rewrites": [{ "source": "/((?!.*\\.).*)", "destination": "/index.html" }]
}
```

This file is picked up automatically by all three Vercel projects since they share the same repo root.

---

## Common Issues

**kubee-pos: `net::ERR_CONNECTION_REFUSED` on `localhost:8086/api/...`**
The POS backend is not running, or runs on a different port than `devUrl` in the environment file. Start it or fix `devUrl`.

**kubee-pos: "blocked by CORS policy" in the browser console**
The app's origin or the HTTP method isn't allowed by the POS backend (`SecurityConfig.corsConfigurationSource`).
Serve the app on an allowed origin, and make sure `PATCH` is in the allowed methods (used to change order lines and
the catalog's available / favourite toggles).

**kubee-pos API calls return `401` / `403`**
The request had no valid ezauth token, or the token has no `tenantUuid` claim. Sign out and back in.

**Build fails with "Cannot find module 'kubee-ui'"**
Run `ng build kubee-ui` first, or use the `npm run build:*` scripts which do this automatically.

**Vercel build fails with font budget error**
Ensure `angular.json` has `"fonts": { "inline": false }` inside the `optimization` block of each app's production configuration. See the Build Configuration Notes section above.

**Vercel build fails with "output directory not found"**
Confirm the Output Directory in the Vercel project settings is set to `dist/<app-name>/browser` (note the `/browser` suffix — Angular 17+ writes output there).

**Domain not resolving after adding DNS record**
Check your DNS record is a `CNAME` pointing to `cname.vercel-dns.com` and that the domain is verified in the Vercel project's domain settings. Use `dig app.kubee.in` to check propagation.

**Local dev server shows stale `kubee-ui` components**
Stop the dev server, run `ng build kubee-ui`, then restart `ng serve`. The dev server does not watch the `kubee-ui` source for changes automatically.
