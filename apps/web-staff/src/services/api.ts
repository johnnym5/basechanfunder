/**
 * API Configuration & Base URL Resolver
 */

import { getPlatformType } from '../utils/deviceDetection';

// For local development on physical mobile devices, use the host PC's IP.
// In production, this would be your deployed API domain.
const REMOTE_API_HOST = '192.168.0.122';

export const getApiBaseUrl = (): string => {
  const platform = getPlatformType();

  // 1. NATIVE ANDROID (APK/WebView)
  // The virtual host (appassets.androidplatform.net) doesn't have a proxy.
  // We must hit the backend directly via HTTP on the local network.
  if (platform === 'NATIVE_ANDROID') {
    return `http://${REMOTE_API_HOST}:3000`;
  }

  // 2. MOBILE WEB or DESKTOP WEB
  // We use relative URLs. This allows the Vite proxy (configured in vite.config.ts)
  // to handle the HTTPS -> HTTP transition automatically, preventing SSL errors.
  return '';
};
