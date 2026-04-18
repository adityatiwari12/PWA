import type { Medication } from '../types/medication';

export type Severity = 'High' | 'Moderate' | 'Low';

export interface InteractionRule {
  drugA: string;
  drugB: string;
  severity: Severity;
  description: string;
}

export interface InteractionAlert {
  id: string; // Unique identifier for the alert
  drugA: string;
  drugB: string;
  severity: Severity;
  description: string;
}

// Precomputed Dataset of known interactions (Lowercase keys for safety)
// In a real application, this would be an expansive dictionary synced to IndexedDB
const INTERACTION_DATASET: InteractionRule[] = [
  {
    drugA: 'paracetamol',
    drugB: 'warfarin',
    severity: 'High',
    description: 'Concurrent use may result in increased bleeding risk.'
  },
  {
    drugA: 'aspirin',
    drugB: 'ibuprofen',
    severity: 'Moderate',
    description: 'May decrease the cardioprotective effect of Aspirin and increase risk of GI bleeding.'
  },
  {
    drugA: 'amoxicillin',
    drugB: 'methotrexate',
    severity: 'High',
    description: 'Amoxicillin can decrease renal clearance of Methotrexate leading to toxicity.'
  },
  {
    drugA: 'lisinopril',
    drugB: 'ibuprofen',
    severity: 'Moderate',
    description: 'NSAIDs may reduce the antihypertensive effect of Lisinopril.'
  }
];

/**
 * Checks for pairwise interactions among a given array of medicines.
 */
export function getInteractionAlerts(medicines: Medication[]): InteractionAlert[] {
  const alerts: InteractionAlert[] = [];
  const n = medicines.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const nameA = (medicines[i].genericName || medicines[i].brandName).toLowerCase();
      const nameB = (medicines[j].genericName || medicines[j].brandName).toLowerCase();

      // Ensure we don't flag unknown drugs as interacting randomly
      if (nameA === 'unknown' || nameB === 'unknown') continue;

      // Find if this pair exists in our dataset (either order)
      const rule = INTERACTION_DATASET.find(
        (r) => 
          (r.drugA === nameA && r.drugB === nameB) || 
          (r.drugA === nameB && r.drugB === nameA)
      );

      if (rule) {
        alerts.push({
          id: `${medicines[i].id}-${medicines[j].id}`,
          drugA: medicines[i].brandName, // Keep original casing
          drugB: medicines[j].brandName,
          severity: rule.severity,
          description: rule.description
        });
      }
    }
  }

  return alerts;
}
