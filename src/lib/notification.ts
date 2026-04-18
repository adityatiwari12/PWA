import type { Medication, DoseSchedule } from '../types/medication';

class NotificationManager {
  private hasPermission: boolean = false;

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    this.hasPermission = permission === 'granted';
    return this.hasPermission;
  }

  async showNotification(title: string, options: NotificationOptions) {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    // Try showing from Service Worker first for better background support
    const registration = await navigator.serviceWorker.ready;
    if (registration) {
      registration.showNotification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options,
      });
    } else {
      new Notification(title, options);
    }
  }

  scheduleFromStore(medications: Medication[]) {
    // Basic implementation: find next dose in the next 24 hours
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    medications.forEach(med => {
      if (med.status !== 'active') return;
      
      med.schedule.forEach(sched => {
        const [hours, mins] = sched.time.split(':').map(Number);
        const doseTime = new Date();
        doseTime.setHours(hours, mins, 0, 0);

        // If dose time is in the past, move to tomorrow
        if (doseTime <= now) {
          doseTime.setDate(doseTime.getDate() + 1);
        }

        const msUntilDose = doseTime.getTime() - now.getTime();
        
        // Only schedule if within next 24 hours (sanity check)
        if (msUntilDose < 24 * 60 * 60 * 1000) {
          setTimeout(() => {
            this.showNotification(`Time for ${med.brandName}`, {
              body: `Dosage: ${med.dosage || '1 unit'}. ${sched.withFood ? 'Take after meal.' : 'Take before meal.'}`,
              tag: `med-${med.id}-${sched.time}`,
              data: { medId: med.id, time: sched.time }
            });
          }, msUntilDose);
        }
      });
    });
  }
}

export const notificationManager = new NotificationManager();
