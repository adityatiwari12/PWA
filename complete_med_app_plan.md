# 📘 Medication Scanner PWA — COMPLETE IMPLEMENTATION (DETAILED)

---

# 🧭 OVERVIEW
Offline-first Progressive Web App for:
- OCR scanning (Tesseract.js)
- Image preprocessing (OpenCV.js)
- Parsing (regex + heuristics)
- Drug interaction detection
- Notifications
- Progressive UI

---

# 🧱 SYSTEM ARCHITECTURE

Camera → Canvas → OpenCV → Tesseract → Parser → DB → Interaction → UI

---

# 📷 CAMERA MODULE (Code)

```javascript
export async function startCamera(videoElement) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoElement.srcObject = stream;
}
```

```javascript
export function captureFrame(video, canvas) {
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/png');
}
```

---

# 🧹 OPENCV PREPROCESSING

```javascript
export function preprocess(canvas) {
  let src = cv.imread(canvas);
  let gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  let thresh = new cv.Mat();
  cv.threshold(gray, thresh, 120, 255, cv.THRESH_BINARY);

  cv.imshow(canvas, thresh);
  src.delete(); gray.delete(); thresh.delete();
}
```

---

# 🔤 OCR MODULE

```javascript
import Tesseract from 'tesseract.js';

export async function runOCR(image) {
  const result = await Tesseract.recognize(image, 'eng', {
    logger: m => console.log(m)
  });
  return result.data.text;
}
```

---

# 🧠 PARSER MODULE

```javascript
export function parseText(text) {
  const dosage = text.match(/\d+\s?(mg|ml|g|mcg)/i);
  const expiry = text.match(/(0[1-9]|1[0-2])\/\d{2,4}/);

  return {
    drug: text.split(' ')[0],
    dosage: dosage ? dosage[0] : null,
    expiry: expiry ? expiry[0] : null
  };
}
```

---

# 💊 DATABASE (IndexedDB)

```javascript
import { openDB } from 'idb';

export const dbPromise = openDB('medDB', 1, {
  upgrade(db) {
    db.createObjectStore('medicines', { keyPath: 'id' });
  }
});
```

---

# ⚠️ INTERACTION ENGINE

```javascript
export function checkInteraction(drugA, drugB, db) {
  const d = db.find(x => x.name === drugA);
  return d?.interactions.includes(drugB);
}
```

---

# 🔔 NOTIFICATIONS

```javascript
self.registration.showNotification("Medicine Reminder", {
  body: "Take your medicine"
});
```

---

# 🎨 UI WIREFRAMES (TEXTUAL)

## Scan Screen
[ Camera View ]
[ Bounding Box Overlay ]
[ Live OCR Text ]

## Result Screen
Drug: [Editable]
Dosage: [Editable]
Expiry: [Editable]

## Dashboard
- Medicine List
- Alerts
- Countdown Timers

---

# 🔌 API CONTRACTS (OPTIONAL BACKEND)

## POST /parse
Input:
```json
{ "text": "raw OCR text" }
```

Output:
```json
{
  "drug": "Paracetamol",
  "dosage": "500 mg",
  "expiry": "08/26"
}
```

---

## GET /interactions?drug=paracetamol

Output:
```json
{
  "interactions": ["Warfarin"]
}
```

---

# 📦 DATASETS

## drugDB.json
```json
[
  {
    "name": "Paracetamol",
    "aliases": ["PCM"],
    "interactions": ["Warfarin"]
  },
  {
    "name": "Ibuprofen",
    "interactions": ["Aspirin"]
  }
]
```

---

## interactions.json
```json
{
  "Paracetamol": ["Warfarin"],
  "Ibuprofen": ["Aspirin"]
}
```

---

# 🚀 PHASES

1. Setup PWA
2. Camera
3. OCR
4. Preprocessing
5. Parser
6. DB
7. Interaction
8. Notifications
9. UI
10. Optimization

---

# 🏆 FINAL NOTE

- Offline-first
- Progressive UI
- Hybrid scalable architecture

