// types/medication.ts
// Based on Sanjivani model_context.md data models — do not rename fields.

export type InteractionSeverity = 'contraindicated' | 'major' | 'minor' | 'none';

export interface DoseSchedule {
  time: string;       // "HH:MM" 24-hour format
  quantity: number;
  unit: string;       // "tablet" | "ml" | "drop" etc.
  withFood: boolean;
  notes?: string;
}

export interface InteractionCheckResult {
  checkedAt: number;             // Unix timestamp (ms)
  interactingDrugId: string;
  interactingDrugName: string;
  severity: InteractionSeverity;
  description: string;
  source: 'openfda' | 'rxnorm' | 'local';
}

export interface JanAushadhiProduct {
  productId: string;
  productName: string;
  genericName: string;
  mrp: number;                   // Jan Aushadhi price in INR
  marketPrice: number;           // Average branded price
  savingsPercent: number;
}

export interface JanAushadhiKendra {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface GovernmentScheme {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  eligibilityConditions: string[];
  applicationUrl?: string;
  category: 'welfare' | 'insurance' | 'subsidy';
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  specialties: string[];
  rating: number;
  openTill: string;
  waitTime: number; // in minutes
}

export interface Medication {
  id: string;
  brandName: string;             // As scanned by OCR
  genericName: string;           // RxNorm normalized
  rxcui?: string;                // RxNorm concept unique identifier
  dosage: string | null;         // e.g., "500mg"
  expiryDate: string | null;     // MM/YYYY or similar
  rawText?: string;
  schedule: DoseSchedule[];
  intelligentSchedule?: string[] | null;
  status: 'active' | 'archived' | 'expired';
  addedAt: number;               // Unix timestamp (ms)
  interactionLog: InteractionCheckResult[];
  janAushadhiEquivalent?: JanAushadhiProduct;
}
