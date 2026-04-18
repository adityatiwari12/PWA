# 📘 Medication Scanner PWA — Phase-wise Detailed Prompts

---

# 🟢 Phase 1: Project Setup

## Prompt
Create a React + Vite + TypeScript project configured as a Progressive Web App (PWA).  
Include:
- vite-plugin-pwa setup
- Tailwind CSS integration
- Proper folder structure
- Service worker registration
- Basic routing (Scan, Dashboard)

Ensure:
- Offline support enabled
- App installable on mobile

---

# 🟡 Phase 2: Camera Module

## Prompt
Build a camera module using getUserMedia that:
- Streams video to a React component
- Allows capturing a frame to canvas
- Includes a bounding box overlay
- Provides user guidance (move closer, hold steady)

---

# 🟠 Phase 3: OCR Integration

## Prompt
Integrate Tesseract.js to:
- Perform OCR on captured image
- Run in Web Worker
- Show real-time OCR progress
- Cache WASM and language files for offline use

---

# 🔵 Phase 4: Image Preprocessing

## Prompt
Integrate OpenCV.js to preprocess images:
- Convert to grayscale
- Apply thresholding
- Improve contrast
- Feed processed image to OCR

---

# 🟣 Phase 5: Parsing Engine

## Prompt
Create a parser that:
- Extracts drug name using dictionary matching
- Extracts dosage using regex
- Extracts expiry using regex
- Returns structured JSON
- Includes fallback heuristics

---

# 🔴 Phase 6: Database

## Prompt
Implement IndexedDB using idb:
- Store medicines
- Store drug dataset
- Enable CRUD operations
- Ensure persistence offline

---

# 🟤 Phase 7: Interaction Engine

## Prompt
Create a module that:
- Checks interactions using precomputed dataset
- Supports pairwise comparison
- Returns severity alerts

---

# ⚫ Phase 8: Notifications

## Prompt
Implement service worker notifications:
- Schedule reminders
- Trigger alerts for expiry
- Handle offline cases

---

# ⚪ Phase 9: Dashboard UI

## Prompt
Build a progressive dashboard:
- Show medicines list
- Show expiry alerts
- Show interaction warnings
- Include countdown timers
- Update in real-time

---

# 🟩 Phase 10: Optimization

## Prompt
Optimize app:
- Lazy load OpenCV
- Resize images before OCR
- Use Web Workers
- Improve performance

---

# 🧠 Bonus Phase: Advanced Features

## Prompt
Add:
- RxNorm API integration
- WebGPU NER model
- Fuzzy drug matching
- Confidence scoring UI

---

# 🏆 Final Instruction

Each phase must:
- Be modular
- Be scalable
- Support offline-first architecture
- Maintain progressive UI behavior

