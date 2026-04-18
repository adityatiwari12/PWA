import { JAN_AUSHADHI_MEDS, JAN_AUSHADHI_KENDRA_LIST } from './janAushadhiDataset';
import type { Medication, JanAushadhiProduct, JanAushadhiKendra } from '../types/medication';

/**
 * Finds a matching Jan Aushadhi equivalent for a given generic name.
 */
export function findJanAushadhiEquivalent(genericName: string): JanAushadhiProduct | null {
  if (!genericName) return null;
  
  const normalizedSearch = genericName.toLowerCase();
  
  // Try to find an exact or partial match in medications
  return JAN_AUSHADHI_MEDS.find(med => 
    normalizedSearch.includes(med.genericName.toLowerCase()) || 
    med.genericName.toLowerCase().includes(normalizedSearch)
  ) || null;
}

/**
 * Calculates monthly savings for a list of medications.
 */
export function calculateMonthlySavings(medications: Medication[]): {
  totalMonthlySpend: number;
  potentialSavings: number;
  savingPercent: number;
} {
  let totalMarket = 0;
  let totalJanAushadhi = 0;

  medications.forEach(med => {
    // We assume dosage/frequency is daily for this simple estimate
    // In a full app, we would parse med.schedule
    const equivalent = med.janAushadhiEquivalent || findJanAushadhiEquivalent(med.genericName);
    
    // Estimate daily price (if dosage is say 500mg and tablet is 500mg)
    // Here we just use the MRP as "monthly" for simplicity in the MVP
    const unitMarket = equivalent ? equivalent.marketPrice : 0;
    const unitJA = equivalent ? equivalent.mrp : 0;
    
    totalMarket += unitMarket;
    totalJanAushadhi += unitJA;
  });

  const potentialSavings = totalMarket - totalJanAushadhi;
  const savingPercent = totalMarket > 0 ? (potentialSavings / totalMarket) * 100 : 0;

  return {
    totalMonthlySpend: totalMarket,
    potentialSavings,
    savingPercent
  };
}

/**
 * Haversine formula to calculate distance between two coordinates in km.
 */
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

/**
 * Finds the nearest Jan Aushadhi Kendra based on user coordinates.
 */
export function findNearestKendra(lat: number, lng: number): (JanAushadhiKendra & { distance: number }) | null {
  if (JAN_AUSHADHI_KENDRA_LIST.length === 0) return null;

  const storesWithDistance = JAN_AUSHADHI_KENDRA_LIST.map(store => ({
    ...store,
    distance: getDistanceInKm(lat, lng, store.coordinates.lat, store.coordinates.lng)
  }));

  return storesWithDistance.sort((a, b) => a.distance - b.distance)[0];
}
