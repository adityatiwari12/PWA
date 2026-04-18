import type { JanAushadhiProduct, JanAushadhiKendra, GovernmentScheme, Hospital } from '../types/medication';

// Extending types locally for the MVP to satisfy the discovery features
export interface ExtendedHospital extends Hospital {
  ayushmanAccepted: boolean;
  basicServices: string[];
}

export interface ExtendedKendra extends JanAushadhiKendra {
  inventory: string[]; // genericNames available
}

/**
 * MOCK JAN AUSHADHI MEDICINE DATASET
 */
export const JAN_AUSHADHI_MEDS: JanAushadhiProduct[] = [
  {
    productId: 'JA-001',
    productName: 'Metformin Hydrochloride 500mg',
    genericName: 'metformin',
    mrp: 12.00,
    marketPrice: 65.00,
    savingsPercent: 81
  },
  {
    productId: 'JA-002',
    productName: 'Amlodipine 5mg',
    genericName: 'amlodipine',
    mrp: 5.50,
    marketPrice: 42.00,
    savingsPercent: 87
  },
  {
    productId: 'JA-003',
    productName: 'Telmisartan 40mg',
    genericName: 'telmisartan',
    mrp: 24.00,
    marketPrice: 115.00,
    savingsPercent: 79
  },
  {
    productId: 'JA-004',
    productName: 'Atorvastatin 10mg',
    genericName: 'atorvastatin',
    mrp: 18.50,
    marketPrice: 95.00,
    savingsPercent: 80
  },
  {
    productId: 'JA-005',
    productName: 'Vildagliptin 50mg',
    genericName: 'vildagliptin',
    mrp: 55.00,
    marketPrice: 245.00,
    savingsPercent: 77
  },
  {
    productId: 'JA-006',
    productName: 'Paracetamol 650mg',
    genericName: 'paracetamol',
    mrp: 14.00,
    marketPrice: 32.00,
    savingsPercent: 56
  },
  {
    productId: 'JA-007',
    productName: 'Pantoprazole 40mg',
    genericName: 'pantoprazole',
    mrp: 22.00,
    marketPrice: 135.00,
    savingsPercent: 84
  },
  {
    productId: 'JA-008',
    productName: 'Rosuvastatin 10mg',
    genericName: 'rosuvastatin',
    mrp: 28.00,
    marketPrice: 185.00,
    savingsPercent: 85
  },
  {
    productId: 'JA-009',
    productName: 'Sitagliptin 100mg',
    genericName: 'sitagliptin',
    mrp: 60.00,
    marketPrice: 380.00,
    savingsPercent: 84
  },
  {
    productId: 'JA-010',
    productName: 'Azithromycin 500mg',
    genericName: 'azithromycin',
    mrp: 45.00,
    marketPrice: 120.00,
    savingsPercent: 62
  },
  {
     productId: 'JA-011',
     productName: 'Pregabalin 300mg',
     genericName: 'pregabalin',
     mrp: 85.00,
     marketPrice: 650.00,
     savingsPercent: 87
  }
];

/**
 * MOCK STORE LOCATIONS (Kendras)
 */
export const JAN_AUSHADHI_KENDRA_LIST: ExtendedKendra[] = [
  {
    id: 'K-001',
    name: 'Jan Aushadhi Kendra - Connaught Place',
    address: 'B-Block, Inner Circle, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    phone: '011-23456789',
    coordinates: { lat: 28.6328, lng: 77.2197 },
    inventory: ['metformin', 'amlodipine', 'telmisartan', 'paracetamol', 'pantoprazole', 'pregabalin']
  },
  {
    id: 'K-002',
    name: 'Jan Aushadhi Kendra - AIIMS Area',
    address: 'Gautam Nagar, Near AIIMS Metro',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110029',
    phone: '011-26707100',
    coordinates: { lat: 28.5683, lng: 77.2064 },
    inventory: ['paracetamol', 'pantoprazole', 'azithromycin', 'atorvastatin', 'rosuvastatin', 'pregabalin']
  },
  {
    id: 'K-003',
    name: 'Jan Aushadhi Kendra - Rajendra Place',
    address: 'Pusa Road, South Patel Nagar',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110008',
    phone: '011-25741234',
    coordinates: { lat: 28.6445, lng: 77.1782 },
    inventory: ['metformin', 'vildagliptin', 'sitagliptin', 'telmisartan']
  },
  {
    id: 'K-004',
    name: 'Jan Aushadhi Kendra - Indore Bypass',
    address: 'Near Silicon City, Indore-Bypass Road',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452012',
    phone: '0731-2345678',
    coordinates: { lat: 22.6500, lng: 75.8200 },
    inventory: ['paracetamol', 'pantoprazole', 'metformin', 'amlodipine']
  }
];

/**
 * REAL HOSPITAL DATA (Delhi Area) with Ayushman Enhancement
 */
export const HOSPITAL_LIST: ExtendedHospital[] = [
  {
    id: 'H-001',
    name: 'AIIMS New Delhi',
    address: 'Ansari Nagar, New Delhi',
    phone: '011-26588500',
    coordinates: { lat: 28.5672, lng: 77.2100 },
    specialties: ['Cardiology ER', 'Neurology', 'Oncology', 'General ER'],
    rating: 4.8,
    openTill: '24/7',
    waitTime: 45,
    ayushmanAccepted: true,
    basicServices: ['Emergency Care', 'Dialysis', 'Surgery', 'Maternity']
  },
  {
    id: 'H-002',
    name: 'Safdarjung Hospital',
    address: 'Ansari Nagar East, New Delhi',
    phone: '011-26707100',
    coordinates: { lat: 28.5683, lng: 77.2064 },
    specialties: ['Burn Unit', 'Pulmonology ER', 'Toxicology / ER', 'General ER'],
    rating: 4.2,
    openTill: '24/7',
    waitTime: 60,
    ayushmanAccepted: true,
    basicServices: ['Trauma Center', 'General Medicine', 'Ophthalmology']
  },
  {
    id: 'H-003',
    name: 'Max Super Speciality, Saket',
    address: '1, 2, Press Enclave Road, Saket, New Delhi',
    phone: '011-26515050',
    coordinates: { lat: 28.5284, lng: 77.2197 },
    specialties: ['Cardiology ER', 'Orthopaedics', 'Pediatrics'],
    rating: 4.5,
    openTill: '24/7',
    waitTime: 15,
    ayushmanAccepted: false,
    basicServices: ['Advanced Cardiology', 'Joint Replacement', 'ICU']
  },
  {
    id: 'H-004',
    name: 'Sir Ganga Ram Hospital',
    address: 'Old Rajinder Nagar, New Delhi',
    phone: '011-25750000',
    coordinates: { lat: 28.6385, lng: 77.1895 },
    specialties: ['General ER', 'Gastroenterology', 'Nephrology'],
    rating: 4.6,
    openTill: '24/7',
    waitTime: 30,
    ayushmanAccepted: true,
    basicServices: ['Liver Transplant', 'Critical Care', 'Gynaecology']
  },
  {
    id: 'H-005',
    name: 'Choithram Hospital & Research Centre',
    address: 'Manik Bagh Road, Indore',
    phone: '0731-2362491',
    coordinates: { lat: 22.6900, lng: 75.8400 },
    specialties: ['General ER', 'Cardiology ER', 'Orthopaedics'],
    rating: 4.7,
    openTill: '24/7',
    waitTime: 20,
    ayushmanAccepted: true,
    basicServices: ['Emergency Care', 'Dialysis', 'Ayushman Ward']
  }
];

export const GOVT_SCHEMES: GovernmentScheme[] = [
  {
    id: 'SCH-001',
    name: 'Ayushman Bharat (PM-JAY)',
    description: 'National health insurance scheme providing coverage of up to ₹5 lakh per family per year.',
    benefits: ['Cashless access', 'Covers pre-existing conditions'],
    eligibilityConditions: ['BPL category', 'SC/ST households'],
    category: 'insurance'
  }
];
