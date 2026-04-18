// types/user.ts
// Based on Sanjivani model_context.md — extended with extensive health tracking fields

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}

export interface UserCurrentMedication {
  name: string;
  dosage: string;
  frequency: string;
  since: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  dateOfBirth: string;           
  gender?: string;
  bloodType: BloodType;
  heightCm: number;
  weightKg: number;
  
  // Medical Info
  allergies: string[];
  chronicConditions: string[];
  pastSurgeries?: string[];
  
  // Current Health
  currentMedications?: UserCurrentMedication[];
  symptoms?: string[];
  
  // Demographics / Lifestyle
  lifestyle?: {
    smoking: boolean;
    alcohol: boolean;
    physicalActivity: string;
    diet: string;
  };
  
  familyHistory?: string[];
  
  // Emergency
  emergencyContacts: EmergencyContact[];
  primaryDoctor?: string;
  preferredHospital?: string;
  
  // Accessibility
  elderlyMode: boolean;
  livingAlone?: boolean;
  hasMonitor?: boolean;
  
  preferredLanguage: 'en' | 'hi';
  createdAt: number;             
  updatedAt: number;
}
