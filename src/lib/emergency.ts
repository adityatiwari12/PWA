// src/lib/emergency.ts
import type { UserProfile, EmergencyContact } from '../types/user';

const EMERGENCY_WEBHOOK_URL = 'https://hook.eu2.make.com/2b9qvf5zvmu99zss88yemjgl11irj4nw';

/**
 * Triggers a webhook whenever an emergency call is initiated.
 * We do not await this fetch to ensure the 'tel:' link is triggered immediately.
 */
export async function triggerEmergencyWebhook(profile: UserProfile, contact: EmergencyContact) {
  const payload = {
    event: 'emergency_call_initiated',
    timestamp: new Date().toISOString(),
    caller: {
      name: profile.name,
      bloodType: profile.bloodType,
    },
    contact: {
      name: contact.name,
      relation: contact.relation,
      phone: contact.phone,
    }
  };

  try {
    // We use a fire-and-forget approach or navigator.sendBeacon if supported and needed,
    // but fetch is fine since we don't await it in the UI logic.
    fetch(EMERGENCY_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    console.log('Emergency webhook triggered successfully');
  } catch (error) {
    console.error('Failed to trigger emergency webhook:', error);
  }
}
