/**
 * Platform Detection Service
 * Identifies if the app is running in the native Android shell or a mobile/desktop browser.
 */

export type PlatformType = 'NATIVE_ANDROID' | 'MOBILE_WEB' | 'DESKTOP_WEB';

export const getPlatformType = (): PlatformType => {
  // Check for native bridge flag injected by MainActivity.kt
  const isNative = !!(window as any).AndroidBridge;

  if (isNative) {
    return 'NATIVE_ANDROID';
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // Simple mobile detection
  if (/android|iphone|kindle|ipad|playbook|silk/i.test(userAgent.toLowerCase())) {
    return 'MOBILE_WEB';
  }

  return 'DESKTOP_WEB';
};
