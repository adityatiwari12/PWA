import { dbOperations } from './db';
import type { Medication } from '../types/medication';

// Safely request permission from the user to display Service Worker notifications
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn("This browser does not support desktop notifications.");
    return false;
  }

  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return Notification.permission === 'granted';
}

// Emits the notification strictly leveraging the local Service Worker (Offline compatible)
export async function triggerNotification(title: string, body: string, tag?: string) {
  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: tag || 'med-alert',
      requireInteraction: true
    });
  }
}

// Mocks a scheduled reminder. 
// Standard localized PWAs rely on the app running in the background or being open.
export function scheduleReminder(medicine: Medication, minutesDelay: number) {
  setTimeout(() => {
    triggerNotification(
      'Medication Reminder', 
      `It's time to take your dose of ${medicine.brandName} (${medicine.dosage || 'Standard'}).`,
      `reminder-${medicine.id}`
    );
  }, minutesDelay * 60 * 1000);
}

// Scans entire IndexedDB offline storage to isolate expiring medications
export async function checkExpiries() {
  const meds = await dbOperations.getMedicines();
  const now = new Date();
  
  meds.forEach(med => {
    if (med.expiryDate) {
      // Decode standard mappings like MM/YY or MM/YYYY
      const parts = med.expiryDate.split('/');
      if (parts.length === 2) {
        const month = parseInt(parts[0], 10);
        const yearText = parts[1].length === 2 ? `20${parts[1]}` : parts[1];
        const year = parseInt(yearText, 10);
        
        // Rough end-of-month expiry 
        const expiryDt = new Date(year, month, 0); 
        
        const diffTime = expiryDt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30 && diffDays > 0) {
          triggerNotification(
            'Medication Expiring Soon!', 
            `${med.brandName} will expire in roughly ${diffDays} days.`,
            `expire-${med.id}`
          );
        } else if (diffDays <= 0) {
          triggerNotification(
            'Medication Expired Alert!', 
            `WARNING: ${med.brandName} has expired. Discard safely.`,
            `expired-${med.id}`
          );
        }
      }
    }
  });
}
