// utils/notifications.js
export async function ensureNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export function notify(title, options) {
  try {
    if (Notification.permission === 'granted') {
      return new Notification(title, options);
    }
  } catch (e) {
    console.warn('notification failed', e);
  }
}
