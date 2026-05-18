# Kubee Frontend Workspace
This repository is an Angular Monorepo that houses the entire frontend ecosystem for Kubee. It uses a shared library architecture to maintain a strict separation of concerns while keeping our minimalist design system consistent across multiple distinct applications.

---

## Architecture

The workspace is divided into four core projects:

1. **`kubee-app`**: The primary tenant-facing inventory management application.
2. **`kubee-admin`**: The internal command center for global SaaS management, tenant oversight, and subscription control.
3. **`kubee-ehr`**: The Electronic Health Record (EHR) management application tailored for specific clinical workflows.
4. **`kubee-ui`**: The shared internal library containing our Tailwind-powered design system, standalone UI components (modals, drawers, toasts, etc.), and global assets.

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

---

## 🎨 UI Component Test Environment

The `kubee-ui` library contains a built-in interactive dashboard that acts as a showcase for all shared UI components. This environment allows you to test modals, toasts, drawers, and date pickers while viewing the exact code required to implement them.

**To view the UI Test Environment:**
1. Ensure your `kubee-ehr` server is running.
2. Navigate to: [http://localhost:4202/ui-demo](http://localhost:4202/ui-demo)

---

## 🛠 Development & Component Creation

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

## 📦 Building for Production & Libraries

### Building the UI Library
Whenever you make changes to files inside the `kubee-ui` folder, you **must** build the library so that the changes are compiled into the `dist/` directory. The applications read from this `dist/` folder.

```bash
ng build kubee-ui
```
*Tip: If an application is throwing a "Cannot find module 'kubee-ui'" error, it means you need to run this build command and restart your `ng serve` process.*

### Building the Applications
To compile the applications for production deployment, run their independent build commands. The output will be stored in the `/dist/<app-name>` directory.

```bash
ng build kubee-app
ng build kubee-admin
ng build kubee-ehr
```