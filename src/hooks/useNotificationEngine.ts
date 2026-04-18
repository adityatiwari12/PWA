import { useEffect, useRef, useState } from 'react';
import { useMedicationStore } from '../store/medicationStore';

export function useNotificationEngine() {
  const { medications, adherence } = useMedicationStore();
  const notifiedSet = useRef<Set<string>>(new Set());
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Request permission on mount
    if ('Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setPermission);
      }
    }
  }, []);

  useEffect(() => {
    if (permission !== 'granted') return;

    // Check every 30 seconds
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const todayStr = now.toISOString().split('T')[0];

      medications.forEach(med => {
        if (med.status !== 'active') return;

        med.schedule.forEach(sched => {
          // Time matches strictly? (Since interval is 30s, this is safe enough to trigger exactly on minute)
          const [hours, minutes] = sched.time.split(':').map(Number);
          
          if (currentHours === hours && currentMinutes === minutes) {
            const doseId = `${med.id}:${todayStr}:${sched.time}`;
            
            // Check if already taken or already notified
            if (adherence[doseId] !== 'taken' && !notifiedSet.current.has(doseId)) {
              
              // Trigger Notification
              new Notification('Sanjeevni Health OS', {
                body: `It's time to take ${med.brandName} (${sched.quantity} ${sched.unit}).\n${sched.withFood ? 'Take after meal.' : 'Take before meal.'}`,
                icon: '/favicon.svg',
                vibrate: [200, 100, 200, 100, 200]
              } as any);
              
              notifiedSet.current.add(doseId);
            }
          }
        });
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [medications, adherence, permission]);

  return { permission };
}
