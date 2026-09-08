import { Capacitor } from '@capacitor/core';

/**
 * Android Native SMS Permission Handler
 * Dynamically requests runtime permissions for SMS inbox access.
 */
export const requestSmsPermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    // Attempt to request permissions via Capacitor SMS Inbox / Android bridge
    // Assuming Plugins.SmsInbox is available or we use the global bridge
    const permissionStatus = await (window as any).Capacitor.Plugins.SmsInbox.requestPermissions();
    return permissionStatus.read === 'granted';
  } catch (err) {
    console.warn('Native SMS permission request failed or plugin not found:', err);
    return false;
  }
};
