/**
 * API Configuration & Base URL Resolver
 */

import { getPlatformType } from '../utils/deviceDetection';

// For local development on physical mobile devices, use the host PC's IP.
// In production, this would be your deployed API domain.
const REMOTE_API_BASE = 'http://192.168.0.122:3000';
export const getApiBaseUrl = (): string => {
  const platform = getPlatformType();

  // If running in the native Android shell or on a mobile browser using the IP directly,
  // we must use the absolute URL to hit the PC's backend.
  if (platform === 'NATIVE_ANDROID' || platform === 'MOBILE_WEB') {
    return REMOTE_API_BASE;
  }

  // On desktop, we use relative URLs which are handled by the Vite proxy.
  return '';
};
