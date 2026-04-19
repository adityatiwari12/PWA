<div align="center">
<img src="sanjivani_logo.png" width="180" alt="Sanjivani Logo"/>

<br/><br/>

<!-- rest of your animated capsule-render banner below -->

<br/>

<!-- Badges row 1 -->
<img src="https://img.shields.io/badge/React_Native-0.74-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
<img src="https://img.shields.io/badge/Expo_SDK-51-000020?style=for-the-badge&logo=expo&logoColor=white"/>
<img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Firebase-Realtime-FFCA28?style=for-the-badge&logo=firebase&logoColor=black"/>

<br/><br/>

<!-- Badges row 2 -->
<img src="https://img.shields.io/badge/Platform-Android_%7C_iOS-1D9E75?style=for-the-badge&logo=android&logoColor=white"/>
<img src="https://img.shields.io/badge/IoT-ESP32_Wearable-B06A10?style=for-the-badge&logo=espressif&logoColor=white"/>
<img src="https://img.shields.io/badge/Language-Hindi_%7C_English-8C2E1A?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Status-Active_Build-4C3FA0?style=for-the-badge"/>

<br/><br/>

<p>
<a href="#-overview">Overview</a> ·
<a href="#-architecture">Architecture</a> ·
<a href="#-features">Features</a> ·
<a href="#-tech-stack">Stack</a> ·
<a href="#-data-models">Data Models</a> ·
<a href="#-firebase">Firebase</a> ·
<a href="#-screen-map">Screens</a> ·
<a href="#-setup">Setup</a> ·
<a href="#-conventions">Conventions</a>
</p>

</div>

---

<!-- Animated divider -->
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## ✦ Overview

<table>
<tr>
<td width="60%">

**Sanjivani** (`संजीवनी`) is the mythological life-restoring herb from the Ramayana — used by Hanuman to revive Lakshmana. The name reflects the platform's mission precisely.

India has **230 million people over 50** managing chronic conditions. The majority take 4–8 medications, prescribed by 3–4 different specialists who have zero visibility into each other's prescriptions. No system connects what a patient is **taking**, what their body is **doing**, and who their family needs to **contact** when something goes wrong.

Sanjivani is that system.

> **For AI code agents:** This README is your single source of truth. Read it entirely before writing a single line. Every architectural decision, naming convention, data model, and feature scope is defined here. Do not invent structure that isn't specified — ask instead.

</td>
<td width="40%" align="center">

```
┌─────────────────────────┐
│   💊 Medication Engine  │
│   🏥 Health Resume      │
│   📡 IoT Vitals Patch   │
│   🔴 Emergency QR       │
│   🌙 Cycle Intelligence │
└──────────┬──────────────┘
           │
     Firebase Core
           │
    ┌──────┴──────┐
    │   Patient   │
    │   Guardian  │
    └─────────────┘
```

</td>
</tr>
</table>

### The Five Layers

<div align="center">

| | Layer | Core Job |
|:---:|---|---|
| 💊 | **Medication Intelligence** | Scan → Normalize → Interact → Price → Schedule → Wearable remind |
| 🏥 | **Health Profile & Resume** | Upload docs → AI parse → living Health Resume → feeds everything |
| 📡 | **IoT Vitals Engine** | ESP32 wearable → live SpO2/HR/Temp → fall & crash detection → anomaly correlation |
| 🔴 | **Emergency Response** | Lock screen QR → SOS flow → guardian teleconsult → doctor health map |
| 🌙 | **Cycle Intelligence** | Phase tracking → vitals correlation → hormonal pattern detection → PCOS early signals |

</div>

### Who Uses This

| Role | Who | How They Interact |
|---|---|---|
| **Patient** | Elderly individual (60+), likely tech-unfamiliar | Voice, wearable reminders, large-text UI, Hindi-first |
| **Guardian** | Son / daughter / spouse, often remote | Vitals dashboard, anomaly alerts, teleconsult booking |
| **Emergency Responder** | Paramedic, doctor, bystander | Scans QR — no app, no login required |
| **Doctor (Teleconsult)** | Medical professional | Receives AI-generated health report before call |

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SANJIVANI PLATFORM                           │
├──────────────┬─────────────────┬────────────────┬────────────────────┤
│  Medication  │  Health Profile │  IoT Engine    │  Emergency Layer   │
│  Intelligence│  & Resume       │  (Client Only) │  + Cycle Intel     │
├──────────────┴─────────────────┴────────────────┴────────────────────┤
│                        Firebase Backend                               │
│         Firestore · Realtime DB · Cloud Functions · FCM · Auth       │
├──────────────┬─────────────────┬────────────────┬────────────────────┤
│  RxNorm API  │  OpenFDA API    │  Jan Aushadhi  │  RAG Backend       │
│  (normalize) │  (interactions) │  + 1mg/PharmEsy│  (Voice Assistant) │
└──────────────┴─────────────────┴────────────────┴────────────────────┘

Separate Repos (NOT in this codebase):
  ├── IoT Firmware        → ESP32 / Arduino (C/C++)
  ├── Emergency Web QR   → Next.js (public endpoint)
  └── Cloud Functions    → Firebase Functions (Node.js)
```

### Data Flow at a Glance

```
Pill Scan ──→ ML Kit OCR ──→ RxNorm ──→ OpenFDA Interact ──→ Jan Aushadhi Price
                                                    │
                                                    ▼
                                          Medication Inventory
                                                    │
                                    ┌───────────────┴───────────────┐
                                    │          Health Resume         │
                                    │  (auto-updated, always live)  │
                                    └───────────────┬───────────────┘
                                                    │
                              ┌─────────────────────┼──────────────────────┐
                              ▼                     ▼                      ▼
                     Emergency QR            RAG Assistant         Cycle Intelligence
                    (public endpoint)     (uses your data)       (vitals + cycle phases)
                              │
                    IoT Patch ──→ Firebase RTDB ──→ Anomaly Detector
                              │                           │
                              └── Fall/Crash ──→ SOS ──→ Guardian Alert
                                                          │
                                                 Doctor Health Map
                                                          │
                                              Teleconsult Booking
                                                          │
                                               Post-consult Notes ──→ Health Resume
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## ✦ Features

<details>
<summary><b>💊 &nbsp; Medication Intelligence Engine</b> &nbsp;—&nbsp; <i>click to expand</i></summary>
<br/>

The core of PS2 (Medication Interaction & Expiry Tracker). Every medication added flows through this full pipeline:

```
Camera Scan
    │
    ▼
ML Kit OCR (on-device, no network)
Extract: name · dosage · quantity · expiry
    │
    ▼
Editable Confirmation Form
User corrects any misread field
    │
    ▼
RxNorm Normalization
Brand name ──→ canonical generic name + rxcui
    │
    ▼
OpenFDA Interaction Check
New drug × entire existing inventory (combinatorial)
    │
    ├── 🔴 CONTRAINDICATED ──→ BLOCKED. Cannot add.
    ├── 🟡 MAJOR CAUTION   ──→ Warning shown. User must acknowledge.
    └── 🟢 MINOR / NONE    ──→ Proceed.
    │
    ▼
Jan Aushadhi Price Compare
Generic equivalent + INR savings + nearest Kendra (GPS)
Also: 1mg + PharmEasy market price
    │
    ▼
Add to Inventory + Health Resume auto-updates
    │
    ▼
Dosage Schedule Builder
Natural language input ──→ NLP parse ──→ structured schedule
    │
    ▼
Push Notifications (FCM)
+ Mi Band direct (Mi Band Notify SDK)
+ Health Connect (Android) / HealthKit (iOS) fallback
+ Vaccination reminders (age-based Indian schedule)
```

**Expiry Tracking:** Alerts at 30 days → 7 days → 1 day before expiry.

</details>

---

<details>
<summary><b>🏥 &nbsp; Health Profile & Resume</b> &nbsp;—&nbsp; <i>click to expand</i></summary>
<br/>

The data backbone. Every other module reads from it. Not a document store — a living AI-maintained health summary.

**Onboarding (4 steps):**
1. Personal — name, DOB, blood type, height, weight
2. Medical — allergies, chronic conditions, emergency contacts
3. Documents — upload reports, prescriptions, discharge summaries
4. Role — Patient or Guardian

**Health Resume** auto-compiles from:
- Manual onboarding inputs
- AI-parsed uploaded documents (OCR + NLP extracts diagnoses, medications, dates, doctor names)
- Active medication inventory
- IoT vitals trends
- Teleconsultation notes

**The Resume feeds:**
- Emergency QR public endpoint (pre-rendered, cached)
- RAG assistant context
- Teleconsultation AI report
- Cycle Intelligence baseline

</details>

---

<details>
<summary><b>📡 &nbsp; IoT Vitals & Safety Engine</b> &nbsp;—&nbsp; <i>click to expand</i></summary>
<br/>

> **This app is the client only.** The ESP32 firmware lives in a separate repo. This app reads from Firebase RTDB — it does not write vitals.

**Hardware (separate repo):**
```
ESP32 Core          — dual-core 240MHz, Wi-Fi + BLE
MAX30102            — SpO2 + Heart Rate (±2% accuracy)
DS18B20             — Body Temperature (±0.5°C)
MPU6050             — 6-axis IMU for fall + crash detection
Power               — 3.7V LiPo, USB-C, ~72h battery
```

**What this app displays:**
- Real-time SpO2, HR, temperature (30s intervals, 5s in alert state)
- 24h / 7d / 30d trend charts
- Anomaly alerts with medication correlation flag
- Guardian remote vitals dashboard

**Fall & Crash Detection Response UI:**
```
MPU6050 detects event (firmware)
    │
Firebase RTDB write
    │
App receives alert
    │
30-second cancel countdown shown
    │
├── Patient cancels ──→ False alarm logged
└── Timeout / no cancel ──→ SOS ACTIVATED
        │
        ├── Guardian push alert + live GPS
        ├── Emergency QR updated (live vitals appended)
        ├── Live vitals stream to guardian dashboard
        └── Doctor Health Map shown with teleconsult CTA
```

**Anomaly → Medication Correlation:**
When vitals breach threshold, system checks medications added in last 72 hours and flags possible adverse reactions. No other consumer health app does this.

</details>

---

<details>
<summary><b>🔴 &nbsp; Emergency Response Layer</b> &nbsp;—&nbsp; <i>click to expand</i></summary>
<br/>

**Emergency QR:**
- Persistent lock screen widget — accessible without unlocking
- Encodes unique HTTPS URL (UUID v4 token) → public read-only web endpoint
- Endpoint displays: name, blood type, allergies, active medications, chronic conditions, emergency contacts
- **No app. No login. No JavaScript required.** Loads in <2s on 3G.
- User can revoke + regenerate token at any time

**SOS Mode:**
- Triggered by: fall detection, crash detection, critical vitals threshold, or manual
- 30-second cancel window before escalating
- On activation: live vitals appended to QR endpoint, guardian alert with GPS, teleconsult flow

**Guardian Teleconsultation Flow:**
1. Guardian receives anomaly alert
2. "Book Teleconsult" CTA in notification
3. Doctor Health Map — geo-filtered by anomaly type / specialty
4. Booking confirmed
5. AI report auto-generated from Health Resume + anomaly event → sent to doctor
6. Post-call: doctor notes + prescriptions ingested back into Health Resume

</details>

---

<details>
<summary><b>🌙 &nbsp; Cycle Intelligence</b> &nbsp;—&nbsp; <i>click to expand</i></summary>
<br/>

Cycle Intelligence is Sanjivani's fifth layer — a vitals-aware menstrual health module that goes beyond simple period tracking by correlating IoT physiological data with cycle phases.

**What it tracks:**

| Phase | Days (avg) | What the system monitors |
|---|---|---|
| Menstruation | 1–5 | SpO2 dips, elevated HR, temperature baseline |
| Follicular | 6–13 | Temperature normalization, HR patterns |
| Ovulation | ~14 | Basal temperature spike (0.2–0.5°C), HR variability |
| Luteal | 15–28 | Sustained temperature elevation, SpO2 patterns |

**How it works:**
```
User logs cycle start date + duration history
    │
    ▼
System calculates current phase
    │
    ▼
IoT patch vitals are overlaid on phase calendar
(BBT-style temperature tracking, HR, SpO2)
    │
    ▼
Pattern Engine compares readings to phase-expected ranges
    │
    ├── Within expected range ──→ Logged, no alert
    └── Outside expected range ──→
            │
            ├── Irregular cycle flag
            ├── Unexpected temperature deviation alert
            ├── Unusual HR pattern across cycle phases
            └── Early PCOS / hormonal imbalance signal
                (informational only — not a diagnosis)
```

**System Integration:**

The Cycle Intelligence module is not isolated. It cross-references:
- **Medication history** — certain medications affect cycle regularity or temperature readings (e.g., hormonal medications, NSAIDs affecting BBT)
- **Health Resume** — diagnosed conditions that interact with cycle health (thyroid, diabetes, PCOS history)
- **RAG Assistant** — voice queries like "is my temperature normal this week?" are answered in cycle context

**What it is not:**
This feature provides informational pattern signals. It explicitly does **not** replace medical diagnosis. All insights include a medical consultation prompt. The PCOS early signal is a pattern observation, not a clinical assessment.

**Data stored per cycle entry:**
```typescript
CycleEntry {
  date: string              // ISO 8601
  phase: CyclePhase         // 'menstruation' | 'follicular' | 'ovulation' | 'luteal'
  dayOfCycle: number
  userLogged: {
    flow?: 'light' | 'medium' | 'heavy' | 'spotting'
    symptoms?: string[]
    mood?: string
  }
  vitalsCorrelated: {
    bbt: number             // basal body temperature (°C)
    hrAvg: number           // average HR that day
    spo2Avg: number         // average SpO2 that day
  }
  flags: CycleFlag[]        // system-detected anomalies
}
```

</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## ⚙ Tech Stack

<div align="center">

| Category | Technology |
|---|---|
| **Framework** | React Native 0.74+ · Expo SDK 51 |
| **Language** | TypeScript (strict — zero `any`) |
| **Navigation** | Expo Router v3 (file-based) |
| **Global State** | Zustand |
| **Server State** | React Query (TanStack) |
| **Styling** | NativeWind v4 (Tailwind for RN) |
| **Animations** | React Native Reanimated v3 |
| **Gestures** | React Native Gesture Handler |
| **Backend** | Firebase (Firestore + RTDB + Auth + Functions + FCM) |
| **OCR** | Google ML Kit Text Recognition (on-device) |
| **Drug Data** | RxNorm API + OpenFDA API |
| **Price Compare** | Jan Aushadhi dataset + 1mg + PharmEasy APIs |
| **Voice** | Expo Speech + @react-native-voice/voice |
| **Wearable** | Mi Band Notify SDK + Health Connect + HealthKit |
| **Maps** | React Native Maps + Expo Location |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide React Native |
| **Storage** | Expo SecureStore (sensitive) + AsyncStorage |
| **Testing** | Jest + React Native Testing Library |
| **Package Manager** | `pnpm` (not npm, not yarn) |

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## 📁 Repository Structure

```
sanjivani/
│
├── app/                                   # Expo Router — file-based routing
│   ├── (auth)/                            # Unauthenticated flow
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   └── onboarding/
│   │       ├── personal.tsx               # Step 1: name, DOB, blood type
│   │       ├── medical.tsx                # Step 2: allergies, conditions
│   │       ├── documents.tsx              # Step 3: upload documents
│   │       └── role.tsx                   # Step 4: patient or guardian
│   │
│   ├── (tabs)/                            # Main authenticated navigation
│   │   ├── _layout.tsx
│   │   ├── home.tsx                       # Dashboard
│   │   ├── medications.tsx                # Medication inventory
│   │   ├── vitals.tsx                     # IoT vitals + charts
│   │   ├── cycle.tsx                      # Cycle Intelligence dashboard
│   │   ├── profile.tsx                    # Health Resume + documents
│   │   └── assistant.tsx                  # Voice RAG assistant
│   │
│   ├── medication/
│   │   ├── scan.tsx                       # Camera OCR
│   │   ├── confirm.tsx                    # OCR result edit form
│   │   ├── interactions.tsx               # Drug interaction result
│   │   ├── price-compare.tsx              # Jan Aushadhi + market prices
│   │   └── schedule.tsx                   # Dosage schedule builder
│   │
│   ├── cycle/
│   │   ├── log.tsx                        # Log period start / symptoms
│   │   ├── insights.tsx                   # Pattern analysis + flags
│   │   └── history.tsx                    # Full cycle history calendar
│   │
│   ├── emergency/
│   │   ├── sos.tsx                        # 30-second SOS countdown
│   │   ├── qr.tsx                         # Emergency QR display
│   │   └── doctor-map.tsx                 # Doctor map + teleconsult
│   │
│   ├── guardian/
│   │   ├── dashboard.tsx                  # Remote vitals view
│   │   └── alerts.tsx                     # Alert history
│   │
│   └── _layout.tsx                        # Root layout + auth gate
│
├── components/
│   ├── ui/                                # Base design system
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── Typography.tsx
│   │
│   ├── medication/
│   │   ├── MedicationCard.tsx
│   │   ├── InteractionFlag.tsx            # Red/Amber/Green severity
│   │   ├── PriceCompareCard.tsx
│   │   └── DoseScheduleRow.tsx
│   │
│   ├── vitals/
│   │   ├── VitalsRing.tsx                 # Animated SpO2/HR ring
│   │   ├── VitalsChart.tsx                # 24h/7d/30d trend
│   │   └── AnomalyAlert.tsx
│   │
│   ├── cycle/
│   │   ├── CycleCalendar.tsx              # Phase-colored calendar
│   │   ├── PhaseIndicator.tsx             # Current phase banner
│   │   ├── VitalsCycleOverlay.tsx         # Vitals overlaid on cycle chart
│   │   └── CycleFlag.tsx                  # Irregular pattern alert card
│   │
│   ├── emergency/
│   │   ├── QRWidget.tsx
│   │   └── SOSCountdown.tsx
│   │
│   └── shared/
│       ├── ElderlyMode.tsx                # Font/target size wrapper
│       └── LanguageProvider.tsx
│
├── hooks/
│   ├── useMedications.ts
│   ├── useVitals.ts
│   ├── useCycle.ts                        # Cycle phase + flags
│   ├── useEmergency.ts
│   ├── useHealthResume.ts
│   ├── useInteractionCheck.ts
│   ├── usePriceCompare.ts
│   └── useVoice.ts
│
├── stores/
│   ├── authStore.ts
│   ├── medicationStore.ts
│   ├── vitalsStore.ts
│   ├── cycleStore.ts                      # Cycle entries + current phase
│   └── emergencyStore.ts
│
├── services/
│   ├── firebase/
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   ├── realtimeDb.ts
│   │   └── fcm.ts
│   ├── ocr/
│   │   └── pillScanner.ts
│   ├── drugs/
│   │   ├── rxnorm.ts
│   │   ├── openFda.ts
│   │   └── priceCompare.ts
│   ├── cycle/
│   │   ├── phaseCalculator.ts             # Current phase from cycle history
│   │   ├── patternEngine.ts               # Anomaly detection across phases
│   │   └── medicationCorrelator.ts        # Meds that affect cycle/BBT
│   ├── rag/
│   │   └── assistant.ts
│   └── wearable/
│       └── healthConnect.ts
│
├── types/
│   ├── medication.ts
│   ├── vitals.ts
│   ├── cycle.ts                           # CycleEntry, CyclePhase, CycleFlag
│   ├── user.ts
│   └── emergency.ts
│
├── constants/
│   ├── colors.ts
│   ├── typography.ts
│   ├── thresholds.ts                      # IoT + cycle alert thresholds
│   └── languages.ts
│
├── utils/
│   ├── dosageParser.ts
│   ├── interactionClassifier.ts
│   ├── cyclePhaseUtils.ts                 # BBT deviation, phase boundaries
│   ├── healthResumeBuilder.ts
│   └── dateHelpers.ts
│
├── i18n/
│   ├── en.json
│   ├── hi.json
│   └── index.ts
│
├── assets/
├── .env.example
├── app.json
├── babel.config.js
├── tailwind.config.js
└── tsconfig.json
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## 🗃 Data Models

> Use these types exactly. Do not rename fields, do not add undocumented fields. All types live in `/types/`.

<details>
<summary><b>UserProfile</b></summary>

```typescript
// types/user.ts
export interface UserProfile {
  uid: string;
  name: string;
  dateOfBirth: string;                    // ISO 8601
  bloodType: BloodType;
  heightCm: number;
  weightKg: number;
  sex: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  allergies: string[];
  chronicConditions: string[];
  emergencyContacts: EmergencyContact[];
  role: 'patient' | 'guardian';
  guardianOf?: string;                    // uid of patient
  elderlyMode: boolean;
  preferredLanguage: 'en' | 'hi' | 'mr' | 'bn' | 'ta';
  qrToken: string;                        // UUID v4
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BloodType =
  | 'A+' | 'A-' | 'B+' | 'B-'
  | 'AB+' | 'AB-' | 'O+' | 'O-'
  | 'Unknown';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}
```
</details>

<details>
<summary><b>Medication</b></summary>

```typescript
// types/medication.ts
export interface Medication {
  id: string;
  uid: string;
  brandName: string;                      // OCR extracted
  genericName: string;                    // RxNorm normalized
  rxcui: string;
  dosage: string;                         // e.g., "500mg"
  quantity: number;
  expiryDate: string;                     // ISO 8601 date
  schedule: DoseSchedule[];
  status: 'active' | 'archived' | 'expired';
  addedAt: Timestamp;
  interactionLog: InteractionCheckResult[];
  janAushadhiEquivalent?: JanAushadhiProduct;
  affectsCycle?: boolean;                 // flagged by medicationCorrelator
  cycleBBTEffect?: 'raises' | 'lowers' | 'unpredictable' | null;
}

export interface DoseSchedule {
  time: string;                           // "HH:MM" 24-hour
  quantity: number;
  unit: string;                           // "tablet" | "ml" | "drop"
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
  mrp: number;                            // INR
  marketPrice: number;
  savingsPercent: number;
  nearestKendra?: {
    name: string;
    address: string;
    distanceKm: number;
    coordinates: GeoPoint;
  };
}
```
</details>

<details>
<summary><b>Vitals</b></summary>

```typescript
// types/vitals.ts
export interface VitalsReading {
  id: string;
  uid: string;
  timestamp: Timestamp;
  spo2: number;                           // 0–100%
  heartRate: number;                      // BPM
  temperature: number;                    // Celsius
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
  cyclePhaseAtEvent?: CyclePhase;         // cross-reference with cycle
  resolved: boolean;
  resolvedAt?: Timestamp;
}

// Alert thresholds (constants/thresholds.ts)
export const VITALS_THRESHOLDS = {
  spo2Low:   90,    // %
  hrLow:     45,    // BPM
  hrHigh:   150,    // BPM
  tempHigh:  38.5,  // °C
} as const;
```
</details>

<details>
<summary><b>Cycle Intelligence</b></summary>

```typescript
// types/cycle.ts
export type CyclePhase =
  | 'menstruation'
  | 'follicular'
  | 'ovulation'
  | 'luteal';

export type CycleFlagType =
  | 'irregular_cycle_length'
  | 'unexpected_bbt_spike'
  | 'unexpected_bbt_drop'
  | 'elevated_hr_across_phases'
  | 'low_spo2_pattern'
  | 'possible_pcos_signal'
  | 'possible_hormonal_imbalance'
  | 'medication_affecting_cycle';

export interface CycleEntry {
  id: string;
  uid: string;
  date: string;                           // ISO 8601
  phase: CyclePhase;
  dayOfCycle: number;
  userLogged: {
    flow?: 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
    symptoms?: string[];                  // e.g. ["cramps", "bloating"]
    mood?: string;
    notes?: string;
  };
  vitalsCorrelated: {
    bbt: number;                          // basal body temperature (°C)
    hrAvg: number;
    spo2Avg: number;
    source: 'iot_patch' | 'manual' | 'estimated';
  };
  flags: CycleFlag[];
}

export interface CycleFlag {
  type: CycleFlagType;
  severity: 'info' | 'watch' | 'consult';
  description: string;
  relatedMedication?: string;
  detectedAt: Timestamp;
}

export interface CycleSummary {
  uid: string;
  averageCycleLength: number;             // days
  averagePeriodLength: number;            // days
  lastPeriodStart: string;
  predictedNextPeriod: string;
  predictedOvulation: string;
  bbtBaselineFollicular: number;          // average BBT in follicular phase
  bbtBaselineLuteal: number;              // average BBT in luteal phase
  activeFlags: CycleFlag[];
  lastUpdated: Timestamp;
}
```
</details>

<details>
<summary><b>Emergency</b></summary>

```typescript
// types/emergency.ts
export interface EmergencySummary {
  // Public QR endpoint payload — read by anyone who scans
  name: string;
  bloodType: BloodType;
  allergies: string[];
  activeMedications: Array<{
    genericName: string;
    dosage: string;
  }>;
  chronicConditions: string[];
  emergencyContacts: EmergencyContact[];
  liveVitals?: VitalsReading;            // populated during SOS mode only
  lastUpdated: string;
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
</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## 🔥 Firebase Architecture

### Firestore Collections

```
users/{uid}
  └── UserProfile

users/{uid}/medications/{medicationId}
  └── Medication

users/{uid}/documents/{documentId}
  └── { name, url, uploadedAt, parsedFields }

users/{uid}/anomaly_log/{anomalyId}
  └── AnomalyEvent

users/{uid}/sos_events/{sosId}
  └── SOSEvent

users/{uid}/teleconsultations/{consultId}
  └── { doctorName, bookedAt, report, notes, prescriptions }

users/{uid}/cycle/{entryId}
  └── CycleEntry

users/{uid}/cycle_summary
  └── CycleSummary (single document, overwritten)

emergency/{qrToken}
  └── EmergencySummary
      Security: allow read if true; allow write if request.auth != null
```

### Realtime Database

```
/vitals/{uid}/current
  └── Latest VitalsReading (overwritten every 30s by IoT patch)

/vitals/{uid}/stream/{timestamp}
  └── Individual readings during SOS mode only
```

### Security Rules Philosophy

| Path | Read | Write |
|---|---|---|
| `users/{uid}/**` | `uid == auth.uid` OR guardian | `uid == auth.uid` |
| `emergency/{token}` | Public (anyone) | Authenticated user |
| `/vitals/{uid}/**` | `uid == auth.uid` OR guardian | IoT patch service account |

### Firebase Initialization

```typescript
// services/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export const app = initializeApp({
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL:       process.env.EXPO_PUBLIC_FIREBASE_RTDB_URL,
});

export const db   = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## 🗺 Screen Map

### Navigation Tree

```
Root _layout.tsx
│
├── (auth) ── not authenticated
│   ├── /welcome
│   ├── /login
│   └── /onboarding/ (linear stack)
│       ├── personal
│       ├── medical
│       ├── documents
│       └── role
│
└── (tabs) ── authenticated
    ├── Tab: /home            (Dashboard)
    ├── Tab: /medications     (Inventory)
    ├── Tab: /vitals          (IoT Display)
    ├── Tab: /cycle           (Cycle Intelligence)  ← shown only if sex ≠ male
    ├── Tab: /profile         (Health Resume)
    └── Tab: /assistant       (Voice RAG)

    Modals (presented over tabs):
    ├── /medication/scan
    ├── /medication/confirm
    ├── /medication/interactions
    ├── /medication/price-compare
    ├── /medication/schedule
    ├── /cycle/log
    ├── /cycle/insights
    ├── /cycle/history
    ├── /emergency/sos          ← programmatic only, never direct nav
    ├── /emergency/qr
    ├── /emergency/doctor-map
    ├── /guardian/dashboard
    └── /guardian/alerts
```

### Screen Inventory

| Screen | Route | Role | Notes |
|---|---|---|---|
| Welcome | `/welcome` | All | Splash + CTA |
| Login | `/login` | All | OTP + Google Sign-In |
| Onboarding: Personal | `/onboarding/personal` | New user | Blood type, DOB, sex |
| Onboarding: Medical | `/onboarding/medical` | New user | Allergies, conditions |
| Onboarding: Documents | `/onboarding/documents` | New user | First doc upload |
| Onboarding: Role | `/onboarding/role` | New user | Patient or Guardian |
| Home Dashboard | `/(tabs)/home` | Both | Summary cards, quick actions |
| Medications | `/(tabs)/medications` | Patient | Inventory + expiry status |
| Vitals | `/(tabs)/vitals` | Both | Live IoT display + trends |
| Cycle | `/(tabs)/cycle` | Patient (female) | Phase display + flag cards |
| Profile | `/(tabs)/profile` | Patient | Health Resume + docs |
| Assistant | `/(tabs)/assistant` | Both | Voice RAG chat |
| Scan | `/medication/scan` | Patient | Camera OCR scan |
| Confirm | `/medication/confirm` | Patient | Edit OCR fields |
| Interactions | `/medication/interactions` | Patient | Severity result |
| Price Compare | `/medication/price-compare` | Patient | Jan Aushadhi + market |
| Schedule | `/medication/schedule` | Patient | NLP dosage builder |
| Cycle Log | `/cycle/log` | Patient | Period start + symptoms |
| Cycle Insights | `/cycle/insights` | Patient | Pattern flags + explanation |
| Cycle History | `/cycle/history` | Patient | Full calendar view |
| SOS | `/emergency/sos` | Patient | 30s countdown |
| QR Display | `/emergency/qr` | Patient | QR + token management |
| Doctor Map | `/emergency/doctor-map` | Guardian | Map + booking |
| Guardian Dashboard | `/guardian/dashboard` | Guardian | Remote vitals |
| Alert History | `/guardian/alerts` | Guardian | Past anomaly events |

### Navigation Rules

- Onboarding is **strictly linear** — no skipping steps
- Guardian users default to `vitals` tab, not `home`
- Cycle tab only renders when `user.sex` is not `'male'`
- `/emergency/sos` can **only** be triggered programmatically — never by direct router push from a non-emergency context
- Cycle features (log, insights, history) are available to guardians as read-only

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## 🔌 API Integrations

<details>
<summary><b>RxNorm — Drug Normalization</b></summary>

```
Base URL: https://rxnav.nlm.nih.gov/REST
Auth:     None required

Normalize brand → generic:
  GET /drugs.json?name={drugName}
  Response path: .drugGroup.conceptGroup[].conceptProperties[].rxcui + .name

Get drug properties:
  GET /rxcui/{rxcui}/allProperties.json?prop=names
```
</details>

<details>
<summary><b>OpenFDA — Drug Interactions</b></summary>

```
Base URL: https://api.fda.gov/drug
Auth:     None for basic queries

Interaction lookup:
  GET /label.json?search=drug_interactions:{genericName}&limit=5
  Parse: .results[].drug_interactions[]

Severity classification: services/drugs/openFda.ts → interactionClassifier.ts
Output: 'contraindicated' | 'major' | 'minor' | 'none'
```
</details>

<details>
<summary><b>Jan Aushadhi — Price Compare</b></summary>

```
Source:   Static JSON — EXPO_PUBLIC_JAN_AUSHADHI_DATASET_URL
Schema:   Array<{ productId, productName, genericName, mrp, category }>
Matching: case-insensitive, partial match on genericName
Also:     1mg + PharmEasy partner APIs (keys in .env)
Service:  services/drugs/priceCompare.ts
```
</details>

<details>
<summary><b>RAG Assistant Backend</b></summary>

```
POST {EXPO_PUBLIC_RAG_API_URL}/query
Authorization: Bearer {EXPO_PUBLIC_RAG_API_KEY}

Body:
{
  query:    string,
  language: 'en' | 'hi' | 'mr' | 'bn' | 'ta',
  context: {
    medications:  string[],    // active genericNames
    allergies:    string[],
    conditions:   string[],
    cyclePhase?:  CyclePhase   // included if available
  }
}

Response:
{
  answer:      string,
  disclaimer:  string,
  sources:     string[]
}
```
</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## 🏪 State Management

```typescript
// stores/authStore.ts
interface AuthStore {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  logout: () => Promise<void>;
}

// stores/medicationStore.ts
interface MedicationStore {
  medications: Medication[];
  isLoading: boolean;
  pendingScan: Partial<Medication> | null;
  setPendingScan: (scan: Partial<Medication> | null) => void;
  addMedication: (med: Medication) => void;
  archiveMedication: (id: string) => void;
  refreshMedications: () => Promise<void>;
}

// stores/vitalsStore.ts
interface VitalsStore {
  current: VitalsReading | null;
  anomalies: AnomalyEvent[];
  sosActive: boolean;
  activateSOS: (trigger: SOSEvent['triggerType']) => void;
  cancelSOS: () => void;
  setCurrentVitals: (v: VitalsReading) => void;
}

// stores/cycleStore.ts
interface CycleStore {
  entries: CycleEntry[];
  summary: CycleSummary | null;
  currentPhase: CyclePhase | null;
  activeFlags: CycleFlag[];
  logEntry: (entry: Omit<CycleEntry, 'id' | 'uid'>) => Promise<void>;
  refreshSummary: () => Promise<void>;
}

// stores/emergencyStore.ts
interface EmergencyStore {
  qrToken: string | null;
  sosActive: boolean;
  lastSOSEvent: SOSEvent | null;
  regenerateToken: () => Promise<void>;
}
```

> **Rule:** Use Zustand for global UI state. Use React Query for all API calls. Use Firebase `onSnapshot` inside custom hooks for real-time Firestore/RTDB — never call them directly in components.

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## 🎨 Design System

### Colors

```typescript
// constants/colors.ts
export const colors = {
  teal:   { 50:'#F0FAF6', 100:'#E1F5EE', 500:'#1D9E75', 700:'#0A6E57', 900:'#064D3D' },
  purple: { 50:'#F7F6FF', 100:'#EDEAFF', 500:'#4C3FA0', 700:'#3A2F7A' },
  amber:  { 50:'#FFFBF5', 100:'#FFF3E0', 500:'#B06A10', 700:'#8A5009' },
  coral:  { 50:'#FFF7F6', 100:'#FDECEA', 500:'#8C2E1A', 700:'#6B2213' },
  // Cycle phase colors
  cycle: {
    menstruation: '#E53E3E',              // red
    follicular:   '#38A169',              // green
    ovulation:    '#D69E2E',              // gold
    luteal:       '#805AD5',              // purple
  },
  // Severity
  danger:  '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
  // Neutrals
  gray: { 50:'#F4F3EF', 200:'#E5E4DF', 500:'#888780', 700:'#3C3C3A', 900:'#1A1A18' },
  white: '#FFFFFF',
} as const;
```

### Typography Scale

```typescript
// constants/typography.ts
// Standard mode
h1:      { fontSize: 28, fontWeight: '700', lineHeight: 36 }
h2:      { fontSize: 22, fontWeight: '700', lineHeight: 30 }
h3:      { fontSize: 18, fontWeight: '600', lineHeight: 26 }
body:    { fontSize: 15, fontWeight: '400', lineHeight: 22 }
caption: { fontSize: 12, fontWeight: '400', lineHeight: 18 }

// Elderly mode (+4px all sizes, +1.2x line height, 56pt min touch targets)
```

### Spacing & Shape

```
Base unit: 4px
Scale:     4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64
Radius:    sm=6 · md=10 · lg=16 · full=9999
Touch:     Standard=44pt min · Elderly=56pt min
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## 🛠 Setup

```bash
# Clone
git clone https://github.com/your-org/sanjivani-app
cd sanjivani-app

# Install (pnpm only)
pnpm install

# Environment
cp .env.example .env.local
# → fill in all EXPO_PUBLIC_ values

# Start
pnpm expo start

# iOS
pnpm expo run:ios

# Android
pnpm expo run:android
```

### `.env.example`

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_RTDB_URL=

EXPO_PUBLIC_RXNORM_BASE_URL=https://rxnav.nlm.nih.gov/REST
EXPO_PUBLIC_OPENFDA_BASE_URL=https://api.fda.gov/drug

EXPO_PUBLIC_PHARMAEASY_API_KEY=
EXPO_PUBLIC_ONEMG_API_KEY=
EXPO_PUBLIC_JAN_AUSHADHI_DATASET_URL=

EXPO_PUBLIC_RAG_API_URL=
EXPO_PUBLIC_RAG_API_KEY=

EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## 📐 Coding Conventions

| Rule | Detail |
|---|---|
| **TypeScript** | Strict mode — zero `any`, zero `@ts-ignore` |
| **Components** | Functional only · One per file · Props interface exported |
| **Styling** | NativeWind only — no `StyleSheet.create`, no inline styles |
| **Data fetching** | React Query for APIs · Firebase `onSnapshot` in hooks |
| **Firebase** | All Firebase calls through `/services/firebase/` only |
| **OCR** | On-device only — never send pill images to a server |
| **Vitals** | Read-only in this app — IoT patch writes, app reads |
| **i18n** | No hardcoded user-facing strings — all in `i18n/en.json` + `i18n/hi.json` |
| **Errors** | All API errors surfaced via Toast — no silent failures — always show retry |
| **Accessibility** | All touchables: `accessibilityLabel` + `accessibilityRole` |
| **Elderly Mode** | Every component must support `elderlyMode` prop |
| **Naming** | Components=PascalCase · Screens=kebab-case · Hooks/Services=camelCase |
| **Dependencies** | Do not add packages not listed in the stack without flagging |

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## 🚫 Out of Scope

> Do not build, scaffold, or reference any of the following in this repo.

| Item | Where it lives |
|---|---|
| Emergency QR public web page | Separate Next.js repo |
| Firebase Cloud Functions (anomaly detector, Health Resume generator, cycle pattern engine) | Separate functions repo |
| ESP32 IoT firmware | Separate C/Arduino repo |
| Doctor-facing portal | Future separate web app |
| In-app video call (teleconsult) | Third-party SDK — not yet scoped |
| Payment processing | Not yet scoped |
| ABHA health ID integration | v2.0 |
| Admin dashboard | Not planned |

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

## 📋 Agent Checklist

Before writing any code, confirm:

- [ ] I have read this README in full
- [ ] The file I'm creating exists in the directory structure above
- [ ] I am using the exact type field names from Section: Data Models
- [ ] All Firebase calls go through `/services/firebase/` — not imported directly
- [ ] All API calls use React Query
- [ ] OCR runs on-device — no image is uploaded to any server
- [ ] Vitals data is read-only in this app
- [ ] The SOS screen has `accessibilityLabel` on every interactive element
- [ ] New strings have entries in both `i18n/en.json` and `i18n/hi.json`
- [ ] Elderly mode is supported in the component I'm building
- [ ] I have not added a dependency not listed in the Tech Stack section

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif"/>

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0A6E57,100:5DCAA5&height=100&section=footer&text=संजीवनी&fontSize=24&fontColor=ffffff&animation=fadeIn&fontAlignY=65"/>

<br/>

*Built with purpose. For the 230 million who deserve better.*

<br/>

**Sanjivani** · Personal Health OS · v2.0 · April 2026

</div>
