/**
 * Helper for browser desktop notification integration
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch {
    return false;
  }
}

export function showDesktopNotification(title: string, options?: NotificationOptions) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  } catch {
    // Some browsers might restrict in certain contexts
  }
}

export function postNetworkStatusNotification(
  downloadSpeedStr: string,
  uploadSpeedStr: string,
  wifiDbm: number,
  sim1Dbm: number,
  sim2Dbm?: number,
  activeIface: string = 'wifi'
) {
  showDesktopNotification(`NetPulse Live: ↓ ${downloadSpeedStr} · ↑ ${uploadSpeedStr}`, {
    body: `Active: ${activeIface.toUpperCase()} | Wi-Fi: ${wifiDbm} dBm | SIM 1: ${sim1Dbm} dBm${
      sim2Dbm ? ` | SIM 2: ${sim2Dbm} dBm` : ''
    }`,
    tag: 'netpulse-live-status',
    silent: true,
  });
}
