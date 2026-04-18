# Sanjivani UI/UX Architecture Redesign: State-Driven Health System

This document outlines the system-level redesign required to elevate Sanjivani from a "tracker" to a protective, clinical-grade **Personal Health OS**. The core philosophy shifts from generic layouts to urgency-aware, state-driven intelligence.

## 1. Global UX Philosophy & State-Driven UI Logic
All screens will inherit a global contextual state. The UI will physically react to the user’s real-time risk profile using severe visual hierarchy instead of flat cards.

**State Machine:**
*   🟢 **SAFE:** “All systems stable.” (Teal/Emerald undertones, calm UI).
*   🟡 **WARNING:** “Missed 2 doses” or "Vitals anomaly." (Amber/Orange undertones, requires attention but not panic).
*   🔴 **CRITICAL:** High interaction risk or dangerous telemetry. (Deep Rose/Red, pulsating urgency, overrides standard navigation).

## 2. What to REMOVE (Strict Deletions)
*   [DELETE] Vague progression metrics (e.g., "0% progress"). 
*   [DELETE] Empty, white-box generic "No Data" states.
*   [DELETE] Static list presentations in the Medications tab.
*   [DELETE] "Good Morning" vanity greetings.
*   [DELETE] Random disconnected visual styles.

## 3. What to ADD & Modify (Component-Level Changes)

### 🟢/🔴 `HomeScreen.tsx` (Deep Overhaul)
*   **Hero Unit:** A colossal, edge-to-edge "System Status" command center (e.g., `Interaction Risk Detected` in full red).
*   **Medication Timeline:** Remove empty cards. Add a visual timeline stack (Taken, Next, Missed) that highlights the exact time proximity.
*   **Actionable Alerts:** Critical alerts pin to the very top right under the Hero.
*   **Biometric Insight Card:** Link `Vitals` telemetry directly into the Home page. E.g., "HR spike detected after taking X drug". 

### 💊 `MedicationsScreen.tsx` (Adding Depth)
*   **Visual Stack:** Stack medicines visually based on their half-life or time-of-day taking structure.
*   **Interaction Graph:** If 2 drugs collide, draw a red connective line or alert unit between them.
*   **Adherence & Delay:** Show explicit adherence scores.

### 🧬 `VitalsScreen.tsx` (Integration)
*   **Contextual Spikes:** Link anomalies to recent actions. E.g., "HRV dropped. You took Albuterol 30 mins ago. This is an expected side-effect."
*   **Anomaly Flags:** Highly visible flags on abnormal readings, changing the screen background organically.

### 🏥 `MapScreen.tsx` (Triage Intelligence)
*   **Dynamic Relevance:** Highlight nearest Ayushman hospital, but inject dynamic triage intelligence (Wait Time: 14 mins, Specialty match for current condition).

### 🔍 `ScanModal.tsx` & `ConfirmModal.tsx`
*   **Live Feedback:** Add "Detecting text...", confidence % indicators.
*   **Extraction Highlighter:** Simulate scanning over the exact labels via UI glow.

## 4. Execution Plan
We will begin by creating the `useSystemState` hook. Then, we will sequentially refactor `HomeScreen.tsx` to listen to it. After achieving the state-driven home layout, we will modify `MedicationsScreen.tsx` and `VitalsScreen.tsx`.

Does this exact vision align before we commence coding?
