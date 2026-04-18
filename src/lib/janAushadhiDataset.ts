import type { JanAushadhiProduct, JanAushadhiKendra, GovernmentScheme } from '../types/medication';

/**
 * MOCK JAN AUSHADHI MEDICINE DATASET
 * In a production app, this would be fetched from EXPO_PUBLIC_JAN_AUSHADHI_DATASET_URL
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
  }
];

/**
 * MOCK STORE LOCATIONS (Kendras)
 */
export const JAN_AUSHADHI_KENDRA_LIST: JanAushadhiKendra[] = [
  {
    id: 'K-001',
    name: 'Jan Aushadhi Kendra - Connaught Place',
    address: 'B-Block, Inner Circle, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    phone: '011-23456789',
    coordinates: { lat: 28.6328, lng: 77.2197 }
  },
  {
    id: 'K-002',
    name: 'Jan Aushadhi Kendra - Dadar East',
    address: 'Opp. Dadar Station, Swami Vivekananda Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400014',
    phone: '022-98765432',
    coordinates: { lat: 19.0178, lng: 72.8478 }
  },
  {
    id: 'K-003',
    name: 'Jan Aushadhi Kendra - Indiranagar',
    address: '100 Feet Road, HAL 2nd Stage',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    phone: '080-12341234',
    coordinates: { lat: 12.9719, lng: 77.6412 }
  },
  {
    id: 'K-004',
    name: 'Jan Aushadhi Kendra - Salt Lake',
    address: 'Sector 1, BD Block',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700064',
    phone: '033-55667788',
    coordinates: { lat: 22.5851, lng: 88.4067 }
  }
];

/**
 * GOVERNMENT SCHEMES DATASET (MVP)
 */
export const GOVT_SCHEMES: GovernmentScheme[] = [
  {
    id: 'SCH-001',
    name: 'Ayushman Bharat (PM-JAY)',
    description: 'National health insurance scheme providing coverage of up to ₹5 lakh per family per year for secondary and tertiary care hospitalization.',
    benefits: [
      'Cashless and paperless access to health services',
      'Covers pre-existing conditions from Day 1',
      'Family size is no bar'
    ],
    eligibilityConditions: [
      'Households listed in SECC-2011 database',
      'Families with no adult male member (16-59 years)',
      'SC/ST households'
    ],
    applicationUrl: 'https://setu.pmjay.gov.in/setu/',
    category: 'insurance'
  },
  {
    id: 'SCH-002',
    name: 'PMBJP (Jan Aushadhi Pariyojana)',
    description: 'Providing quality medicines at affordable prices for all through special outlets known as Jan Aushadhi Kendra.',
    benefits: [
      'Medicines available at 50% to 90% lesser price than branded',
      'Quality assurance through NABL accredited labs',
      'Widely available across India'
    ],
    eligibilityConditions: [
      'All citizens of India',
      'Doctor prescription required for Schedule H drugs'
    ],
    applicationUrl: 'https://janaushadhi.gov.in/',
    category: 'subsidy'
  },
  {
    id: 'SCH-003',
    name: 'Rashtriya Vayoshri Yojana',
    description: 'A scheme for providing physical aids and assisted-living devices for Senior Citizens belonging to BPL category.',
    benefits: [
      'Free of cost distribution of walking sticks, elbow crutches, walkers, hearing aids, etc.',
      'Comprehensive assessment of needs'
    ],
    eligibilityConditions: [
      'Senior Citizens (60+ years)',
      'Belong to BPL category'
    ],
    category: 'welfare'
  }
];
