import { InjectionToken, Provider } from '@angular/core';

/**
 * Configuration interface for the kubee-ui library.
 * Each consuming application provides its own values via `provideKubeeConfig()`.
 */
export interface KubeeConfig {
  production: boolean;
  authUrl: string;
  devUrl: string;
  appName: string;
  appKey: string;
  googleClientId: string;
}

/**
 * InjectionToken used to provide application-specific configuration
 * to shared kubee-ui services (HttpService, CommonService, etc.).
 */
export const KUBEE_CONFIG = new InjectionToken<KubeeConfig>('KUBEE_CONFIG');

/**
 * Provider function to configure the kubee-ui library.
 * Call this in each application's `app.config.ts` providers array.
 *
 * @example
 * ```ts
 * // In kubee-admin/src/app/app.config.ts
 * import { provideKubeeConfig } from 'kubee-ui';
 * import { environment } from '../environments/environment';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideKubeeConfig(environment),
 *     // ... other providers
 *   ]
 * };
 * ```
 */
export function provideKubeeConfig(config: KubeeConfig): Provider {
  return { provide: KUBEE_CONFIG, useValue: config };
}
