# Kubee Frontend Workspace

This repository is an Angular Monorepo that houses the entire frontend ecosystem for Kubee. It uses a shared architecture to maintain a strict separation of concerns while keeping our minimalist design system consistent across platforms.

## Architecture

The workspace is divided into three core pillars:

* **`kubee-app`**: The primary tenant-facing inventory management application.
* **`kubee-admin`**: The internal command center for global SaaS management and subscription control.
* **`kubee-ui`**: The shared internal library containing our Tailwind-powered design system, bento-grid components, and global assets (like logos).

---

## Running Locally

You can run both applications simultaneously. Open two terminal instances and run the following commands:

**1. Start the Tenant Inventory App (Port 4200)**

```bash
ng serve kubee-app --port 4200

```

*Accessible at: `http://localhost:4200*`

**2. Start the Admin Dashboard (Port 4201)**

```bash
ng serve kubee-admin --port 4201

```

*Accessible at: `http://localhost:4201*`

---

## Development & Component Creation

All reusable UI elements (buttons, cards, inputs, layout wrappers) must be built inside the shared `kubee-ui` library to ensure design consistency.

**Generate a new shared component:**

```bash
ng generate component components/your-component-name --project=kubee-ui

```

**Workflow for Shared Components:**

1. Generate the component using the command above.
2. Build the component using our shared Tailwind CSS classes.
3. Export the component in `projects/kubee-ui/src/public-api.ts`.
4. Import the `KubeeUiModule` into your app to use it.

---

## Production Build

To compile the applications for deployment, run the independent build commands. The output will be stored in the `/dist` directory.

```bash
ng build kubee-app
ng build kubee-admin

```


after you make any ui component in kubee-ui you need to run this command to access 
npx ng build kubee-ui