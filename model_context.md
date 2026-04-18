# संजीवनी — Sanjivani Mobile App
### Personal Health Operating System — React Native (Expo)

> **For AI code agents:** This README is your single source of truth. Read it fully before writing any code. Every architectural decision, naming convention, data model, and feature scope is defined here. Do not invent structure that isn't specified — ask instead.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Environment Setup](#4-environment-setup)
5. [Feature Scope](#5-feature-scope)
6. [Screen Inventory](#6-screen-inventory)
7. [Navigation Architecture](#7-navigation-architecture)
8. [Data Models](#8-data-models)
9. [Firebase Architecture](#9-firebase-architecture)
10. [API Integrations](#10-api-integrations)
11. [State Management](#11-state-management)
12. [Component Library](#12-component-library)
13. [Design System](#13-design-system)
14. [Coding Conventions](#14-coding-conventions)
15. [Out of Scope](#15-out-of-scope)

---

## 1. Project Overview

**Sanjivani** is a React Native mobile application targeting elderly Indian users (60+) and their guardians. It solves one core problem: India's elderly manage 4–8 medications prescribed by multiple specialists, with no single system connecting what they take, how their body responds, and who their family needs to contact in an emergency.

### The Four Layers

| Layer | What it does |
|---|---|
| **Medication Intelligence** | Scan pill bottles via OCR → detect drug interactions → schedule reminders → compare Jan Aushadhi prices |
| **Health Profile & Resume** | Upload medical documents → AI-parsed Health Resume → feeds all other layers |
| **IoT Vitals Engine** | Companion to ESP32 wearable patch — displays live vitals, anomaly alerts, fall/crash detection responses *(IoT firmware is a separate repo — this app is the client only)* |
| **Emergency Response** | Lock screen QR widget, SOS flow, guardian teleconsultation, doctor health map |

### Who Uses This App

- **Patient (Primary):** Elderly person, likely tech-unfamiliar. Interacts via voice, wearable reminders, and large-text UI.
- **Guardian:** Family member (son/daughter/spouse) who monitors vitals, receives alerts, books teleconsultations.
- The app handles **both roles** — role is set during onboarding and can be switched.

---

## 2. Tech Stack

```
Framework:        React Native 0.74+ with Expo SDK 51
Language:         TypeScript (strict mode — no `any`)
Navigation:       Expo Router v3 (file-based routing)
State:            Zustand (global) + React Query (server state)
Backend:          Firebase (Firestore + Realtime Database + Auth + Cloud Functions + FCM)
OCR:              Google ML Kit Text Recognition (@react-native-ml-kit/text-recognition)
UI Components:    NativeWind v4 (Tailwind for RN) + custom design system
Icons:            Lucide React Native
Animations:       React Native Reanimated v3
Gestures:         React Native Gesture Handler
Camera:           Expo Camera
Notifications:    Expo Notifications + Firebase Cloud Messaging
Wearable:         React Native Health Connect (Android) + HealthKit (iOS)
Maps:             React Native Maps + Expo Location
Voice Input:      Expo Speech + @react-native-voice/voice
Forms:            React Hook Form + Zod
Storage:          Expo SecureStore (sensitive) + AsyncStorage (non-sensitive)
Testing:          Jest + React Native Testing Library
```

### Package Manager
```
pnpm (not npm, not yarn)
```

---

## 3. Repository Structure

```
sanjivani/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (auth)/                   # Unauthenticated screens
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   └── onboarding/
│   │       ├── personal.tsx      # Step 1: Basic info
│   │       ├── medical.tsx       # Step 2: Allergies, conditions, blood type
│   │       ├── documents.tsx     # Step 3: Upload medical documents
│   │       └── role.tsx          # Step 4: Patient or Guardian setup
│   ├── (tabs)/                   # Main tab navigation (authenticated)
│   │   ├── _layout.tsx
│   │   ├── home.tsx              # Dashboard
│   │   ├── medications.tsx       # Medication inventory
│   │   ├── vitals.tsx            # IoT vitals dashboard
│   │   ├── profile.tsx           # Health Resume + documents
│   │   └── assistant.tsx         # Voice RAG assistant
│   ├── medication/
│   │   ├── scan.tsx              # Camera OCR scan screen
│   │   ├── confirm.tsx           # OCR result + edit form
│   │   ├── interactions.tsx      # Drug interaction result screen
│   │   ├── price-compare.tsx     # Jan Aushadhi + pharmacy price comparison
│   │   └── schedule.tsx          # Dosage schedule builder
│   ├── emergency/
│   │   ├── sos.tsx               # SOS activation screen
│   │   ├── qr.tsx                # Emergency QR display
│   │   └── doctor-map.tsx        # Doctor health map + teleconsult booking
│   ├── guardian/
│   │   ├── dashboard.tsx         # Guardian vitals + alerts view
│   │   └── alerts.tsx            # Alert history
│   └── _layout.tsx               # Root layout
├── components/
│   ├── ui/                       # Base design system components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── Typography.tsx
│   ├── medication/
│   │   ├── MedicationCard.tsx
│   │   ├── InteractionFlag.tsx   # Red/Amber/Green severity badge
│   │   ├── PriceCompareCard.tsx
│   │   └── DoseScheduleRow.tsx
│   ├── vitals/
│   │   ├── VitalsRing.tsx        # Circular SpO2/HR display
│   │   ├── VitalsChart.tsx       # 24h/7d/30d trend graph
│   │   └── AnomalyAlert.tsx
│   ├── emergency/
│   │   ├── QRWidget.tsx          # Lock screen QR component
│   │   └── SOSCountdown.tsx      # 30-second cancel timer
│   └── shared/
│       ├── ElderlyMode.tsx       # Wrapper that bumps font size + simplifies UI
│       └── LanguageProvider.tsx
├── hooks/
│   ├── useMedications.ts
│   ├── useVitals.ts
│   ├── useEmergency.ts
│   ├── useHealthResume.ts
│   ├── useInteractionCheck.ts
│   ├── usePriceCompare.ts
│   └── useVoice.ts
├── stores/
│   ├── authStore.ts              # Zustand — user auth state
│   ├── medicationStore.ts        # Zustand — medications list + schedule
│   ├── vitalsStore.ts            # Zustand — real-time vitals
│   └── emergencyStore.ts         # Zustand — SOS state + QR token
├── services/
│   ├── firebase/
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   ├── realtimeDb.ts
│   │   └── fcm.ts
│   ├── ocr/
│   │   └── pillScanner.ts        # ML Kit wrapper + preprocessing
│   ├── drugs/
│   │   ├── rxnorm.ts             # RxNorm API client
│   │   ├── openFda.ts            # OpenFDA interaction check
│   │   └── priceCompare.ts       # Jan Aushadhi + 1mg + PharmEasy
│   ├── rag/
│   │   └── assistant.ts          # Voice RAG API client
│   └── wearable/
│       └── healthConnect.ts      # Health Connect + HealthKit bridge
├── types/
│   ├── medication.ts
│   ├── vitals.ts
│   ├── user.ts
│   ├── emergency.ts
│   └── drug.ts
├── constants/
│   ├── colors.ts                 # Design system color tokens
│   ├── typography.ts             # Font scale
│   ├── thresholds.ts             # IoT alert thresholds
│   └── languages.ts              # Supported locales
├── utils/
│   ├── dosageParser.ts           # NLP dosage text → schedule object
│   ├── interactionClassifier.ts  # Red/Amber/Green logic
│   ├── healthResumeBuilder.ts    # Assembles Health Resume from all data
│   └── dateHelpers.ts
├── i18n/
│   ├── en.json
│   ├── hi.json
│   └── index.ts
├── assets/
│   ├── fonts/
│   └── images/
├── .env.example
├── app.json
├── babel.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 4. Environment Setup

### `.env.example`
```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_RTDB_URL=

# Drug APIs
EXPO_PUBLIC_RXNORM_BASE_URL=https://rxnav.nlm.nih.gov/REST
EXPO_PUBLIC_OPENFDA_BASE_URL=https://api.fda.gov/drug
EXPO_PUBLIC_PHARMAEASY_API_KEY=
EXPO_PUBLIC_ONEMG_API_KEY=

# RAG Backend (self-hosted or cloud)
EXPO_PUBLIC_RAG_API_URL=
EXPO_PUBLIC_RAG_API_KEY=

# Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=

# Jan Aushadhi dataset URL (static JSON hosted on CDN)
EXPO_PUBLIC_JAN_AUSHADHI_DATASET_URL=
```

### Getting Started
```bash
git clone https://github.com/your-org/sanjivani-app
cd sanjivani-app
pnpm install
cp .env.example .env.local
# Fill in .env.local
pnpm expo start
```

---

## 5. Feature Scope

### ✅ IN SCOPE — Mobile App (this repo)

#### Medication Intelligence
- [ ] Pill bottle camera scan (Expo Camera)
- [ ] On-device OCR via ML Kit (name, dosage, expiry extraction)
- [ ] Editable OCR confirmation form
- [ ] RxNorm normalization API call
- [ ] OpenFDA drug interaction check (full inventory combinatorial)
- [ ] Interaction severity display — Red (block) / Amber (warn) / Green (allow)
- [ ] Jan Aushadhi price comparison card
- [ ] 1mg + PharmEasy market price comparison
- [ ] Nearest Jan Aushadhi Kendra map (GPS)
- [ ] Dosage instruction input (natural language)
- [ ] NLP dosage → structured schedule parser
- [ ] Push notification schedule generation (FCM)
- [ ] Wearable reminder delivery (Health Connect + HealthKit)
- [ ] Medication inventory dashboard
- [ ] Expiry alerts (30d / 7d / 1d)
- [ ] Vaccination reminders (age-based)

#### Health Profile & Resume
- [ ] Multi-step onboarding flow
- [ ] Medical document upload (PDF/JPG/PNG) to Firebase Storage
- [ ] Health Resume display screen
- [ ] Document viewer

#### IoT Vitals (Client-side only — reads from Firebase RTDB)
- [ ] Real-time SpO2, HR, temperature display
- [ ] 24h / 7d / 30d trend charts
- [ ] Anomaly alert display + medication correlation flag
- [ ] Guardian vitals dashboard
- [ ] Fall/crash detection response UI (cancel countdown, SOS activation)
- [ ] Live vitals stream during SOS mode

#### Emergency Response
- [ ] Emergency QR display screen
- [ ] QR lock screen widget (Expo Widgets / Android Quick Settings)
- [ ] SOS countdown screen (30-second cancel window)
- [ ] SOS activation flow
- [ ] Doctor Health Map screen
- [ ] Teleconsultation booking UI
- [ ] Post-consultation notes view

#### AI Assistant
- [ ] Voice input (Hindi + English)
- [ ] RAG query interface
- [ ] Response display with disclaimer

#### Accessibility / Elderly Mode
- [ ] Elderly mode toggle (larger text, simplified nav, slower TTS)
- [ ] Hindi + English UI (i18n)
- [ ] High contrast mode

---

### ❌ OUT OF SCOPE — Mobile App

These exist in the system but are **NOT built in this repo:**

- IoT firmware (ESP32 / Arduino — separate repo)
- Emergency QR public web endpoint (Next.js — separate repo)
- Firebase Cloud Functions / backend logic (separate repo)
- Hospital management or ambulance routing
- Doctor-facing portal
- Payment processing for teleconsultation
- ABHA health ID integration (v2.0)

---

## 6. Screen Inventory

| Screen | Route | Role | Description |
|---|---|---|---|
| Welcome | `/welcome` | All | Splash + CTA |
| Login | `/login` | All | OTP + Google |
| Onboarding: Personal | `/onboarding/personal` | New user | Name, DOB, blood type |
| Onboarding: Medical | `/onboarding/medical` | New user | Allergies, conditions |
| Onboarding: Documents | `/onboarding/documents` | New user | Upload first documents |
| Onboarding: Role | `/onboarding/role` | New user | Patient or Guardian |
| Home Dashboard | `/(tabs)/home` | Both | Summary cards, quick actions |
| Medications | `/(tabs)/medications` | Patient | Inventory list |
| Vitals | `/(tabs)/vitals` | Both | Live vitals + chart |
| Profile | `/(tabs)/profile` | Patient | Health Resume + docs |
| Assistant | `/(tabs)/assistant` | Both | Voice RAG chat |
| Scan | `/medication/scan` | Patient | Camera OCR |
| Confirm | `/medication/confirm` | Patient | Edit OCR result |
| Interactions | `/medication/interactions` | Patient | Interaction result |
| Price Compare | `/medication/price-compare` | Patient | Jan Aushadhi + market |
| Schedule | `/medication/schedule` | Patient | Dosage input + schedule |
| SOS | `/emergency/sos` | Patient | 30s countdown + cancel |
| QR Display | `/emergency/qr` | Patient | Emergency QR + token |
| Doctor Map | `/emergency/doctor-map` | Guardian | Map + booking |
| Guardian Dashboard | `/guardian/dashboard` | Guardian | Remote vitals view |
| Alert History | `/guardian/alerts` | Guardian | Past anomaly events |

---

## 7. Navigation Architecture

```
Root Layout (_layout.tsx)
├── (auth) — shown when user is NOT authenticated
│   ├── welcome
│   ├── login
│   └── onboarding/ (stack)
│       ├── personal
│       ├── medical
│       ├── documents
│       └── role
└── (tabs) — shown when user IS authenticated
    ├── Tab: Home
    ├── Tab: Medications
    ├── Tab: Vitals
    ├── Tab: Profile
    └── Tab: Assistant
    
    Modals (presented over tabs):
    ├── medication/scan
    ├── medication/confirm
    ├── medication/interactions
    ├── medication/price-compare
    ├── medication/schedule
    ├── emergency/sos
    ├── emergency/qr
    ├── emergency/doctor-map
    ├── guardian/dashboard
    └── guardian/alerts
```

### Navigation Rules
- Onboarding is **linear** — cannot skip steps. Uses a local `onboardingStep` state in Zustand.
- Guardian users land on `vitals` tab by default, not `home`.
- `emergency/sos` can only be triggered programmatically (IoT alert or manual SOS button) — never direct navigation.

---

## 8. Data Models

All types live in `/types/`. Use these exactly — do not rename fields.

```typescript
// types/user.ts
export interface UserProfile {
  uid: string;
  name: string;
  dateOfBirth: string;           // ISO 8601
  bloodType: BloodType;
  heightCm: number;
  weightKg: number;
  allergies: string[];
  chronicConditions: string[];
  emergencyContacts: EmergencyContact[];
  role: 'patient' | 'guardian';
  guardianOf?: string;           // uid of patient (for guardian role)
  elderlyMode: boolean;
  preferredLanguage: 'en' | 'hi' | 'mr' | 'bn' | 'ta';
  qrToken: string;               // UUID v4 — used in emergency QR URL
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}
```

```typescript
// types/medication.ts
export interface Medication {
  id: string;                    // Firestore document ID
  uid: string;                   // Owner user ID
  brandName: string;             // As scanned by OCR
  genericName: string;           // RxNorm normalized
  rxcui: string;                 // RxNorm concept unique identifier
  dosage: string;                // e.g., "500mg"
  quantity: number;
  expiryDate: string;            // ISO 8601 date
  schedule: DoseSchedule[];
  status: 'active' | 'archived' | 'expired';
  addedAt: Timestamp;
  interactionLog: InteractionCheckResult[];
  janAushadhiEquivalent?: JanAushadhiProduct;
}

export interface DoseSchedule {
  time: string;                  // "HH:MM" 24-hour format
  quantity: number;
  unit: string;                  // "tablet" | "ml" | "drop" etc.
  withFood: boolean;
  notes?: string;
}

export interface InteractionCheckResult {
  checkedAt: Timestamp;
  interactingDrugId: string;
  interactingDrugName: string;
  severity: 'contraindicated' | 'major' | 'minor' | 'none';
  description: string;
  source: 'openfda' | 'rxnorm';
}

export interface JanAushadhiProduct {
  productId: string;
  productName: string;
  mrp: number;                   // in INR
  marketPrice: number;           // branded equivalent price
  savingsPercent: number;
  nearestKendra?: {
    name: string;
    address: string;
    distanceKm: number;
    coordinates: GeoPoint;
  };
}
```

```typescript
// types/vitals.ts
export interface VitalsReading {
  id: string;
  uid: string;
  timestamp: Timestamp;
  spo2: number;                  // percentage 0-100
  heartRate: number;             // BPM
  temperature: number;           // Celsius
  source: 'iot_patch' | 'manual';
}

export interface AnomalyEvent {
  id: string;
  uid: string;
  timestamp: Timestamp;
  type: 'spo2_low' | 'hr_high' | 'hr_low' | 'temp_high' | 'fall' | 'crash';
  vitalsAtEvent: VitalsReading;
  medicationCorrelation?: {
    medicationId: string;
    medicationName: string;
    addedHoursAgo: number;
    flag: string;
  };
  resolved: boolean;
  resolvedAt?: Timestamp;
}

export interface SOSEvent {
  id: string;
  uid: string;
  triggeredAt: Timestamp;
  triggerType: 'manual' | 'fall' | 'crash' | 'vitals_critical';
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  cancelledAt?: Timestamp;
  cancelled: boolean;
}
```

```typescript
// types/emergency.ts
export interface EmergencySummary {
  // This is what the public QR endpoint displays
  // Generated from UserProfile + active Medications
  name: string;
  bloodType: BloodType;
  allergies: string[];
  activeMedications: Array<{
    genericName: string;
    dosage: string;
  }>;
  chronicConditions: string[];
  emergencyContacts: EmergencyContact[];
  liveVitals?: VitalsReading;    // Only populated during SOS mode
  lastUpdated: string;           // ISO 8601
}
```

---

## 9. Firebase Architecture

### Collections (Firestore)

```
users/{uid}
  - UserProfile document

users/{uid}/medications/{medicationId}
  - Medication document

users/{uid}/documents/{documentId}
  - { name, url, uploadedAt, parsedFields }

users/{uid}/anomaly_log/{anomalyId}
  - AnomalyEvent document

users/{uid}/sos_events/{sosId}
  - SOSEvent document

users/{uid}/teleconsultations/{consultId}
  - { doctorName, bookedAt, report, notes, prescriptions }

emergency/{qrToken}
  - EmergencySummary document (public read, auth write)
  - Security rule: allow read if true; allow write if request.auth != null
```

### Realtime Database (IoT vitals stream)

```
/vitals/{uid}/current
  - Latest VitalsReading (overwrites on each IoT write)

/vitals/{uid}/stream/{timestamp}
  - Individual readings during SOS mode only
```

### Security Rules Philosophy
- `users/{uid}/**` — read/write only by `request.auth.uid == uid`
- `emergency/{qrToken}` — public read, authenticated write
- `/vitals/{uid}/**` — read by uid OR by the uid's designated guardian

### Firebase Initialization
```typescript
// services/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_RTDB_URL,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
```

---

## 10. API Integrations

### RxNorm (Drug Normalization)
```
Base URL: https://rxnav.nlm.nih.gov/REST
No auth required.

Normalize brand → generic:
  GET /drugs.json?name={drugName}
  Response: .drugGroup.conceptGroup[].conceptProperties[].rxcui + .name

Get drug info:
  GET /rxcui/{rxcui}/allProperties.json?prop=names
```

### OpenFDA (Drug Interactions)
```
Base URL: https://api.fda.gov/drug
No auth required for basic queries.

Interaction check:
  GET /label.json?search=drug_interactions:{genericName}&limit=5
  Parse: .results[].drug_interactions for known interaction text
```

### Jan Aushadhi Dataset
```
Static JSON dataset hosted on EXPO_PUBLIC_JAN_AUSHADHI_DATASET_URL
Schema: Array<{ productId, productName, genericName, mrp, category }>
Match by genericName (case-insensitive, partial match allowed)
```

### 1mg / PharmEasy
```
See .env for API keys.
These are partner APIs — endpoints provided at integration time.
Wrapper goes in: services/drugs/priceCompare.ts
Return type must match JanAushadhiProduct (marketPrice field)
```

### RAG Assistant Backend
```
POST {EXPO_PUBLIC_RAG_API_URL}/query
Headers: Authorization: Bearer {EXPO_PUBLIC_RAG_API_KEY}
Body: {
  query: string,
  language: 'en' | 'hi' | 'mr' | 'bn' | 'ta',
  context: {
    medications: string[],     // genericNames from active medications
    allergies: string[],
    conditions: string[]
  }
}
Response: { answer: string, disclaimer: string, sources: string[] }
```

---

## 11. State Management

### Zustand Stores

#### `authStore.ts`
```typescript
interface AuthStore {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  logout: () => Promise<void>;
}
```

#### `medicationStore.ts`
```typescript
interface MedicationStore {
  medications: Medication[];
  isLoading: boolean;
  pendingScan: Partial<Medication> | null;  // OCR result awaiting confirmation
  setPendingScan: (scan: Partial<Medication> | null) => void;
  addMedication: (med: Medication) => void;
  archiveMedication: (id: string) => void;
  refreshMedications: () => Promise<void>;
}
```

#### `vitalsStore.ts`
```typescript
interface VitalsStore {
  current: VitalsReading | null;
  anomalies: AnomalyEvent[];
  sosActive: boolean;
  activateSOS: (trigger: SOSEvent['triggerType']) => void;
  cancelSOS: () => void;
  setCurrentVitals: (v: VitalsReading) => void;
}
```

### React Query Usage
- Use React Query for **all API calls** (RxNorm, OpenFDA, price compare, RAG)
- Use Firebase `onSnapshot` listeners (not React Query) for real-time Firestore/RTDB data
- Wrap Firebase listeners inside custom hooks — never call them directly in components

---

## 12. Component Library

### Base UI Components (`components/ui/`)

All base components accept a `size` prop of `'sm' | 'md' | 'lg'` and an `elderlyMode` boolean that increases tap targets and font sizes.

#### `Button.tsx`
```typescript
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  elderlyMode?: boolean;
}
```

#### `InteractionFlag.tsx`
```typescript
// Displays a colored severity badge for drug interactions
interface InteractionFlagProps {
  severity: 'contraindicated' | 'major' | 'minor' | 'none';
  drugName: string;
  description: string;
  expandable?: boolean;   // shows full description on tap
}
// Colors: contraindicated=#DC2626, major=#D97706, minor=#16A34A, none=#6B7280
```

#### `VitalsRing.tsx`
```typescript
// Circular animated ring showing SpO2 or HR with threshold color
interface VitalsRingProps {
  value: number;
  type: 'spo2' | 'hr' | 'temp';
  size?: number;
  animate?: boolean;
}
```

#### `SOSCountdown.tsx`
```typescript
// 30-second countdown with large cancel button
// Auto-proceeds to SOS activation if not cancelled
interface SOSCountdownProps {
  onCancel: () => void;
  onActivate: () => void;
  triggerType: SOSEvent['triggerType'];
}
```

---

## 13. Design System

### Colors (`constants/colors.ts`)
```typescript
export const colors = {
  // Primary
  teal: {
    50:  '#F0FAF6',
    100: '#E1F5EE',
    500: '#1D9E75',
    700: '#0A6E57',
    900: '#064D3D',
  },
  // Severity
  danger:  '#DC2626',   // contraindicated interactions, SOS
  warning: '#D97706',   // major interactions, anomaly alerts
  success: '#16A34A',   // safe interactions, normal vitals
  // Neutral
  gray: {
    50:  '#F4F3EF',
    200: '#E5E4DF',
    500: '#888780',
    700: '#3C3C3A',
    900: '#1A1A18',
  },
  white: '#FFFFFF',
};
```

### Typography (`constants/typography.ts`)
```typescript
export const typography = {
  // Standard
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  // Elderly mode overrides (+4px on all sizes, +1.2x line height)
};
```

### Spacing
```
Base unit: 4px
Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

### Border Radius
```
sm: 6, md: 10, lg: 16, full: 9999
```

---

## 14. Coding Conventions

### TypeScript
- Strict mode — no `any`, no `@ts-ignore`
- All API responses typed — create types in `/types/` before building service
- Prefer `interface` over `type` for object shapes
- Enums only for fixed, known sets (e.g., `BloodType`)

### Component Rules
- Functional components only — no class components
- One component per file
- Props interface defined in the same file, exported
- No inline styles — NativeWind classes only, with `cn()` utility for conditional classes
- No business logic in components — extract to hooks

### Hooks
- Custom hooks in `/hooks/` — prefix `use`
- Each hook has a single responsibility
- All Firebase listeners cleaned up in `useEffect` return

### File Naming
```
Components:  PascalCase.tsx         (MedicationCard.tsx)
Screens:     kebab-case.tsx         (price-compare.tsx)
Hooks:       camelCase.ts           (useMedications.ts)
Services:    camelCase.ts           (rxnorm.ts)
Types:       camelCase.ts           (medication.ts)
Stores:      camelCase.ts           (medicationStore.ts)
```

### Error Handling
- All API calls wrapped in try/catch
- Errors surfaced to user via `Toast` component — never silent failures
- Network errors must show retry option
- OCR failure must allow manual entry fallback

### Accessibility
- All touchable elements: `accessibilityLabel` and `accessibilityRole`
- Minimum touch target: 44x44pt
- Elderly mode: 56x56pt minimum
- All images: `accessibilityLabel`

### i18n
- No hardcoded user-facing strings — all text via `i18n/en.json` and `i18n/hi.json`
- Use `useTranslation()` hook from `i18n/index.ts`
- Keys: `screen.component.element` (e.g., `medication.scan.cta`)

---

## 15. Out of Scope

Do not build, suggest, or scaffold any of the following in this repo:

| Item | Where it lives |
|---|---|
| Emergency QR public web page | Separate Next.js repo |
| Firebase Cloud Functions (anomaly detector, Health Resume generator) | Separate functions repo |
| ESP32 IoT firmware | Separate C/Arduino repo |
| Doctor-facing portal | Future separate web app |
| Admin dashboard | Not yet planned |
| In-app payment / teleconsult video call | Third-party SDK integration — not yet scoped |
| ABHA health ID integration | v2.0 |

---

## Notes for AI Code Agents

1. **Check this README before creating any file.** The directory structure above is the target — do not create files outside it without explicit instruction.
2. **Use the exact type definitions from Section 8.** Do not rename fields or add fields not listed.
3. **All Firebase calls go through `/services/firebase/`.** Never import Firebase SDK directly in a component or screen.
4. **All API calls use React Query.** Do not use `useState` + `useEffect` for data fetching.
5. **The OCR scanner is on-device only.** Never send pill bottle images to a server.
6. **The IoT vitals display is read-only.** This app reads from Firebase RTDB — it does not write vitals data. That comes from the IoT patch firmware.
7. **The SOS flow is critical path.** The `emergency/sos.tsx` screen must be the most tested, most accessible screen in the app. Every element needs an `accessibilityLabel`.
8. **Elderly mode is not an afterthought.** Every component must support `elderlyMode` prop. When `elderlyMode=true`: +4px font sizes, minimum 56pt touch targets, simplified layouts, slower animations.
9. **Hindi is a first-class language.** Every new string added must have a corresponding entry in both `i18n/en.json` and `i18n/hi.json` before the feature is considered complete.
10. **Do not add dependencies not listed in Section 2** without flagging it. Keep the bundle lean.
