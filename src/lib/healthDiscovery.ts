import { JAN_AUSHADHI_MEDS, type ExtendedKendra } from './janAushadhiDataset';
import type { Medication, JanAushadhiProduct } from '../types/medication';

export interface MedicineMatch {
  medicationId: string;
  genericName: string;
  janAushadhiEquivalent: JanAushadhiProduct;
  isAvailableNearby: boolean;
  savings: number;
}

/**
 * findGenericSubstitutes
 * Matches the user's active medications with Jan Aushadhi generic equivalents.
 */
export function findGenericSubstitutes(
  medications: Medication[],
  nearbyKendras: ExtendedKendra[]
): MedicineMatch[] {
  const matches: MedicineMatch[] = [];

  const activeMeds = medications.filter(m => m.status === 'active');

  activeMeds.forEach(med => {
    // 1. Find the generic equivalent in our dataset
    const equivalent = JAN_AUSHADHI_MEDS.find(ja => 
      ja.genericName.toLowerCase() === med.genericName.toLowerCase()
    );

    if (equivalent) {
      // 2. Check if any nearby Kendra has this in their inventory
      const isAvailable = nearbyKendras.some(kendra => 
        kendra.inventory.includes(equivalent.genericName.toLowerCase())
      );

      matches.push({
        medicationId: med.id,
        genericName: med.genericName,
        janAushadhiEquivalent: equivalent,
        isAvailableNearby: isAvailable,
        savings: equivalent.marketPrice - equivalent.mrp
      });
    }
  });

  return matches;
}

/**
 * calculatePriceSavings
 * Formats a savings string for the UI.
 */
export function formatSavingsString(savings: number, marketPrice: number): string {
  const percent = Math.round((savings / marketPrice) * 100);
  return `Save ₹${savings.toFixed(0)} (${percent}% less)`;
}
