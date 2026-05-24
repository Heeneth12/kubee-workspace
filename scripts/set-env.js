/**
 * Reads environment variables and writes them into the Angular environment
 * files before the build runs. Called automatically by npm run build:* scripts.
 *
 * Variables are set in the Vercel dashboard under:
 *   Project → Settings → Environment Variables
 *
 * Required variables (set per-project in Vercel):
 *   AUTH_URL          — e.g. https://auth.kubee.in
 *   API_URL           — e.g. https://inventory.kubee.in (kubee-app)
 *                       or  https://ops-api.kubee.in   (kubee-admin)
 *   APP_NAME          — e.g. "Kubee Inventory" or "Kubee Ops"
 *   APP_KEY           — e.g. EZH_INV_APP or KUBEE_OPS
 *   GOOGLE_CLIENT_ID  — OAuth client ID (can be empty string if unused)
 */

const fs = require('fs');
const path = require('path');

const APP = process.argv[2]; // 'kubee-app' | 'kubee-admin' | 'kubee-ehr'

if (!APP) {
  console.error('Usage: node scripts/set-env.js <app-name>');
  process.exit(1);
}

const AUTH_URL        = process.env['AUTH_URL']         || '';
const API_URL         = process.env['API_URL']          || '';
const APP_NAME        = process.env['APP_NAME']         || '';
const APP_KEY         = process.env['APP_KEY']          || '';
const GOOGLE_CLIENT_ID = process.env['GOOGLE_CLIENT_ID'] || '';

if (!AUTH_URL || !API_URL) {
  console.error('[set-env] ERROR: AUTH_URL and API_URL must be set as environment variables.');
  console.error('          Set them in the Vercel dashboard under Project → Settings → Environment Variables.');
  process.exit(1);
}

const envDir = path.join(__dirname, `../projects/${APP}/src/environments`);

const prodContent = `export const environment = {
  production: true,
  authUrl: '${AUTH_URL}',
  devUrl: '${API_URL}',
  appName: '${APP_NAME}',
  appKey: '${APP_KEY}',
  googleClientId: '${GOOGLE_CLIENT_ID}'
};
`;

// Write both files so localhost never leaks through regardless of which
// Angular configuration the builder picks up.
fs.writeFileSync(path.join(envDir, 'environment.ts'), prodContent);
fs.writeFileSync(path.join(envDir, 'environment.development.ts'), prodContent);

console.log(`[set-env] Wrote environment.ts + environment.development.ts for ${APP}`);
console.log(`          AUTH_URL  = ${AUTH_URL  || '(not set)'}`);
console.log(`          API_URL   = ${API_URL   || '(not set)'}`);
console.log(`          APP_NAME  = ${APP_NAME  || '(not set)'}`);
console.log(`          APP_KEY   = ${APP_KEY   || '(not set)'}`);
