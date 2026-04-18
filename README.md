# Sanjivani Health OS 🏥

Sanjivani is a lightweight, resilient, and state-driven Personal Health Operating System designed to simplify medication management and emergency response. Built with the **Roxy Design System**, it prioritizes clinical accuracy, speed, and actionable health insights.

![Sanjivani Banner](https://img.shields.io/badge/Health-OS-E84040)
![Platforms](https://img.shields.io/badge/Platform-PWA%20%7C%20Android%20%7C%20iOS-blue)

## 🚀 Key Features

### 🔍 Intelligent Cloud Vision
A dual-tier vision pipeline for medication scanning:
- **Tier 1 (Groq)**: Ultra-fast extraction using Llama 3.2 11B Vision for sub-second response times.
- **Tier 2 (Gemini)**: Robust fallback using Gemini 1.5 Flash for high-accuracy clinical entity recognition.
- **Slim Footprint**: Zero local ML models bundled, reducing APK size dramatically.

### 🛡️ SOS & Emergency Network
- **Instant SOS**: Globally accessible emergency trigger with pulse animation.
- **Web-Triggered Alerts**: Automated webhook integration to notify emergency contacts and log events instantly.
- **Nearby Services**: Map-integrated discovery for hospitals and pharmacies.

### 💊 Medication Management
- **Roxy UI**: Clean, high-contrast white & red design for maximum readability.
- **Smart Scheduling**: Automatic dose reminders and "Before/After Meal" toggles.
- **Drug Interaction Check**: (Optional) Safety checks against known medication conflicts.

### 📈 Vitals Tracking
- Log and monitor blood pressure, SpO2, and heart rate with a history-first view.

---

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (Roxy Design System)
- **Mobile Bridge**: Capacitor 8 (Cross-platform Android/iOS)
- **Database**: Dexie.js (IndexedDB for offline-first persistence)
- **AI/Vision**: Groq Vision API & Google Gemini 1.5 Flash

---

## 🏃 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- Android Studio (for Android build)
- Xcode (for iOS build - macOS only)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/adityatiwari12/PWA.git
   cd PWA
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Setup Environment Variables:
   Create a `.env` file in the root:
   ```env
   VITE_GROQ_API_KEY=your_groq_key
   VITE_GEMINI_API_KEY=your_gemini_key
   ```

### Running Locally
- **Web (Development)**: `npm run dev`
- **Android**: 
  ```bash
  npm run build
  npx cap sync android
  npx cap open android
  ```
- **iOS**:
  ```bash
  npm run build
  npx cap sync ios
  npx cap open ios
  ```

---

## 📦 Build & Optimization
The project uses `HashRouter` and relative asset pathing to ensure 100% compatibility with Android WebViews and PWA environments.

---

## 📄 License
MIT License. Created with ❤️ for Health OS.
